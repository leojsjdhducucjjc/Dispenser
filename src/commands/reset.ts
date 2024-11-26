import { Command, CommandOption, Bot, CommandPermissions } from "../classes/Bot";
import {
    ApplicationCommandOptionType,
    ChatInputCommandInteraction
} from "discord.js";
import schedule from "node-schedule";
import DB from "../classes/DB";
import Utils from "../classes/Utils";
import dotenv from "dotenv";
dotenv.config();

export default class extends Command {
    override async run(interaction: ChatInputCommandInteraction, bot: Bot): Promise<void> {
        await interaction.deferReply({ ephemeral: interaction.options.getBoolean("ephemeral") ?? true });

        switch (interaction.options.getSubcommand()) {
            case "user": {
                let user = interaction.options.get("user")!;
                try {
                    await DB.resetUserUsage(user.user!.id, interaction.guild!.id, interaction.options.getBoolean("dupes") ?? false);
                } catch (e) {
                    await interaction.editReply({ embeds: [Utils.getEmbed(Utils.EmbedType.Red, { title: `Failed to reset user`, description: e!.toString() })] });
                    return;
                }
                await interaction.editReply({
                    embeds: [
                        Utils.getEmbed(Utils.EmbedType.Default, {
                            title: `Success!`,
                            description: `Reset user ${interaction.options.getUser("user")?.tag} \nI reset their usage count${interaction.options.getBoolean("dupes") ? ", and their dupes." : " only."}`
                        })
                    ]
                });
                await Utils.sendWebhook(interaction.guild!.id, Utils.WebhookType.Logs, [
                    Utils.getEmbed(Utils.EmbedType.Default, {
                        title: `User Reset`,
                        fields: [
                            {
                                name: "User",
                                value: `<@${user.user!.id}> (${user.user!.tag} | ${user.user!.id})`,
                            },
                            {
                                name: "Reset Dupes",
                                value: interaction.options.getBoolean("dupes") ? "Yes" : "No",
                            },
                            {
                                name: "Reset By",
                                value: `<@${interaction.user.id}> (${interaction.user.tag} | ${interaction.user.id})`,
                            },
                        ]
                    })
                ])
            } break;

            case "all": {
                try {
                    await DB.resetAll(interaction.guild!.id, interaction.options.getBoolean("dupes") ?? false);
                } catch (e) {
                    await interaction.editReply({ embeds: [Utils.getEmbed(Utils.EmbedType.Red, { title: `Failed to reset all users`, description: e!.toString() })] });
                    return;
                }

                await interaction.editReply({
                    embeds: [
                        Utils.getEmbed(Utils.EmbedType.Default, {
                            title: `Success! Reset all users.`,
                            description: `I reset their usage count${interaction.options.getBoolean("dupes") ? ", and reset their dupes." : " only."}`
                        })
                    ]
                });

                await Utils.sendWebhook(interaction.guild!.id, Utils.WebhookType.Logs, [
                    Utils.getEmbed(Utils.EmbedType.Default, {
                        title: `All Users Reset`,
                        fields: [
                            {
                                name: "Reset By",
                                value: `<@${interaction.user.id}> (${interaction.user.tag} | ${interaction.user.id})`,
                            },
                            {
                                name: "Reset Dupes",
                                value: interaction.options.getBoolean("dupes") ? "Yes" : "No",
                            }
                        ]
                    })
                ])
            } break;
        }

    }

    override name(): string {
        return "reset";
    }

    override description(): string {
        return "Reset usage";
    }

    override options(): CommandOption[] {
        return [
            {
                name: "user",
                description: "Reset a user",
                type: ApplicationCommandOptionType.Subcommand,
                options: [
                    {
                        type: ApplicationCommandOptionType.User,
                        name: "user",
                        description: "User to reset",
                        required: true
                    },
                    {
                        type: ApplicationCommandOptionType.Boolean,
                        name: "dupes",
                        description: "Allow the user to receive the same domains again.",
                        required: false
                    },
                    {
                        type: ApplicationCommandOptionType.Boolean,
                        name: "ephemeral",
                        description: "Whether the response should be ephemeral or not.",
                        required: false
                    }
                ]
            },
            {
                name: "all",
                description: "Reset all users",
                type: ApplicationCommandOptionType.Subcommand,
                options: [
                    {
                        type: ApplicationCommandOptionType.Boolean,
                        name: "dupes",
                        description: "Allow the users to receive the same domains again.",
                        required: false
                    },
                    {
                        type: ApplicationCommandOptionType.Boolean,
                        name: "ephemeral",
                        description: "Whether the response should be ephemeral or not.",
                        required: false
                    }
                ]
            }
        ];
    }

    override permissions(): CommandPermissions {
        return {
            dmUsable: false,
            adminRole: true,
        }
    }
}

schedule.scheduleJob("0 12 * * 0", async () => {
    try {
        console.log("[Scheduler] Resetting all users...");
        if (!process.env.GUILD_ID) {
            throw new Error("");
        }
        await DB.resetAll(process.env.GUILD_ID, false); 

        if (!process.env.GUILD_ID) {
            throw new Error("");
        }
        await Utils.sendWebhook(process.env.GUILD_ID, Utils.WebhookType.Logs, [
            Utils.getEmbed(Utils.EmbedType.Default, {
                title: `Success! Reset all users.`,
                description: `I reset their usage count only.`,
                fields: [
                    { name: "Dupes Reset", value: "No" },
                    { name: "Time", value: new Date().toISOString() },
                ],
            }),
        ]);

        console.log("[Scheduler] Reset successful.");
    } catch (error) {
        console.error("[Scheduler] Failed to reset all users:", error);
    }
});
