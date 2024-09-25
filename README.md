# Dispenser

## Features
- Easy administration commands
- Domain categories
- Custom role limits
- Limit a category behind a role
- Duplicate domain prevention
- Duplicate domain reset
- Domain reporting

# Deployment

## Prerequisites
- **Node.js** (v18 or higher)
- **Git** (v2.4.1 or higher)
- **Postgres** (v15 or higher)

## Installation
To install **Dispenser**, you must first clone the repository:

```bash
git clone https://github.com/UseInterstellar/Dispenser.git
cd Dispenser
```

Copy `.env.example` to `.env`:

- **Windows:**
  ```bash
  copy .env.example .env
  ```

- **macOS/Linux:**
  ```bash
  cp .env.example .env
  ```

Then, edit `.env` with any text editor and fill out the necessary keys.

Now, run the designated install script for your system:

- **macOS/Linux:**
  ```bash
  ./start.sh
  ```

- **Windows:**
  ```bash
  start.bat
  ```

## License

MIT
