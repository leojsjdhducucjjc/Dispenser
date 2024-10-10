import { Command, CommandOption, Bot, CommandPermissions } from "../classes/Bot";
import {
    ApplicationCommandOptionType,
    ChatInputCommandInteraction,
} from "discord.js";
import DB from "../classes/DB";
import Utils from "../classes/Utils";
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const LinksPath = path.join(__dirname, '../json/links.json');

interface GroupData {
    GroupID: string;
    domains: string[]; 
}

interface LinksData {
    groups: GroupData[];
}

function readLinksFile(): LinksData {
    try {
        const data = fs.readFileSync(LinksPath, 'utf8');
        return JSON.parse(data) as LinksData;
    } catch (err) {
        console.error('Error reading links file:', err);
        return { groups: [] }; 
    }
}

export default class extends Command {
    override async run(interaction: ChatInputCommandInteraction, bot: Bot): Promise<void> {
        await interaction.deferReply({ ephemeral: true });

        switch (interaction.options.getSubcommand()) {
            case "list": {
                try {
                    const dbGroups = await DB.getAll(interaction.guildId!, "groups"); 
                    await interaction.editReply({
                        embeds: [
                            Utils.getEmbed(Utils.EmbedType.Default, {
                                title: "All Links",
                                description: dbGroups.map((g: any) => {
                                    const domainsList = g.domains.length >= 1 ? g.domains.map((d: any) => `\`${d.domainName}\``).join(", ") : `No links in this group`;
                                    return `**${g.groupId}**\n${domainsList}`;
                                }).join("\n\n") || `No links in this server`
                            })
                        ]
                    });
                } catch (e) {
                    console.log(e);
                    await interaction.editReply({
                        embeds: [
                            Utils.getEmbed(Utils.EmbedType.Red, {
                                title: `Failed to list links!`,
                                description: e!.toString()
                            })
                        ]
                    });
                }
            } break;

            case "sync": {
                const linksData = readLinksFile();

                try {
                    await DB.clearAllDomains(interaction.guildId!); 

                    for (const group of linksData.groups) {
                        for (const domain of group.domains) {
                            await DB.createDomain(interaction.guildId!, interaction.user.id, domain, group.GroupID);
                        }
                    }

                    await interaction.editReply({
                        embeds: [
                            Utils.getEmbed(Utils.EmbedType.Default, { 
                                title: `Success`, 
                                description: `All links have been synced with the database.` 
                            })
                        ]
                    });

                    await Utils.sendWebhook(interaction.guildId!, Utils.WebhookType.Logs, [
                        Utils.getEmbed(Utils.EmbedType.Default, {
                            title: `Links Synced`,
                            description: `All links have been synced by <@${interaction.user.id}> (${interaction.user.tag} | ${interaction.user.id}).`
                        })
                    ]);
                } catch (e) {
                    console.error("Error syncing links:", e);
                    await interaction.editReply({
                        embeds: [
                            Utils.getEmbed(Utils.EmbedType.Red, { 
                                title: `Error`, 
                                description: `An error occurred while syncing links. Please try again later.` 
                            })
                        ]
                    });
                }
            } break;

            case "delete": {
                try {
                    await DB.deleteDomain(interaction.guildId!, interaction.options.getString("link")!, interaction.options.getString("group")!);
                } catch (e) {
                    await interaction.editReply({ embeds: [ Utils.getEmbed(Utils.EmbedType.Red, { title: `Failed to remove the link`, description: e!.toString() }) ] });
                    return;
                }

                await interaction.editReply({ embeds: [ Utils.getEmbed(Utils.EmbedType.Default, { title: `Success`, description: `Removed ${interaction.options.getString("link")!} from group \`${interaction.options.getString("group")}\`.`}) ] });

                await Utils.sendWebhook(interaction.guildId!, Utils.WebhookType.Logs, [
                    Utils.getEmbed(Utils.EmbedType.Default, {
                        title: `Link Removed`,
                        fields: [
                            {
                                name: "Link",
                                value: interaction.options.getString("link")!,
                            },
                            {
                                name: "Group",
                                value: interaction.options.getString("group")!,
                            },
                            {
                                name: "Removed By",
                                value: `<@${interaction.user.id}> (${interaction.user.tag} | ${interaction.user.id})`,
                            },
                        ]
                    })
                ]);
            } break;
        }
    }

    override name(): string {
        return "links";
    }

    override description(): string {
        return "Link management";
    }

    override options(): CommandOption[] {
        return [
            {
                name: "delete",
                description: "Delete a link from the bot",
                type: ApplicationCommandOptionType.Subcommand,
                options: [
                    {
                        name: "group",
                        description: "The group to delete from",
                        type: ApplicationCommandOptionType.String,
                        required: true
                    },
                    {
                        name: "link",
                        description: "The link to delete",
                        type: ApplicationCommandOptionType.String,
                        required: true
                    }
                ]
            },
            {
                name: "list",
                description: "List all links",
                type: ApplicationCommandOptionType.Subcommand,
            },
            {
                name: "sync",
                description: "Sync links to the database",
                type: ApplicationCommandOptionType.Subcommand,
            }
        ]
    }

    override permissions(): CommandPermissions {
        return {
            dmUsable: false,
            adminRole: true
        }
    }
}
