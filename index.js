const { Client, GatewayIntentBits, Collection } = require("discord.js");
const fs = require("fs");
const path = require("path");
const http = require("http");
require("dotenv").config();

const client = new Client({
  intents: [GatewayIntentBits.Guilds],
});

client.commands = new Collection();

// Helper: load commands from ./commands or fallback to repo root. Safe to call multiple times.
function loadCommandsFromFs() {
  const path = require('path');
  const commandsDir = path.resolve(__dirname, 'commands');
  let files = [];
  try {
    if (fs.existsSync(commandsDir)) {
      files = fs.readdirSync(commandsDir).filter(f => f.endsWith('.js'));
      console.log('Loading command files from ./commands:', files);
      for (const file of files) {
        try {
          const full = path.join(commandsDir, file);
          // clear cache so updates are picked up on re-load
          delete require.cache[require.resolve(full)];
          const command = require(full);
          if (command && command.data && command.data.name) {
            client.commands.set(command.data.name, command);
          } else {
            console.warn(`Skipping invalid command file: ${file}`);
          }
        } catch (err) {
          console.error(`Failed to load command file ${file}:`, err && err.message);
        }
      }
    } else {
      console.log('⚠ Commands folder not found. Skipping command loading.');
      // fallback: scan repo root
      const rootFiles = fs.readdirSync(__dirname).filter(f => f.endsWith('.js'));
      const exclude = new Set(['index.js', 'deploy-commands.js', 'missionData.js', 'package.json']);
      const rootCommandFiles = rootFiles.filter(f => !exclude.has(f));
      if (rootCommandFiles.length) {
        console.log('Found possible command files at repo root:', rootCommandFiles);
        for (const file of rootCommandFiles) {
          try {
            const full = path.join(__dirname, file);
            delete require.cache[require.resolve(full)];
            const command = require(full);
            if (command && command.data && command.data.name) {
              client.commands.set(command.data.name, command);
              console.log(`Loaded command from root: ${file}`);
            }
          } catch (err) {
            // not a command file, ignore
          }
        }
      }
    }
  } catch (err) {
    console.error('Error while scanning commands:', err && err.message);
  }
}

// initial load (best-effort)
loadCommandsFromFs();

// If no commands were loaded from files (e.g., missing folder in deployment),
// provide a small built-in fallback command so the bot still exposes at least
// one slash command in Discord (useful for testing deployments like Railway).
if (client.commands.size === 0) {
  try {
    const { SlashCommandBuilder } = require('discord.js');
    const pingCommand = {
      data: new SlashCommandBuilder().setName('ping').setDescription('Check bot is alive'),
      async execute(interaction) {
        await interaction.reply({ content: 'Pong!', ephemeral: true });
      }
    };
    client.commands.set(pingCommand.data.name, pingCommand);
    console.log('⚡ No command files found — registered fallback command: /ping');
  } catch (e) {
    console.warn('Could not register fallback command:', e);
  }
}

// Debug: show commands folder status
try {
  const commandsPath = path.resolve(__dirname, 'commands');
  console.log('cwd:', process.cwd());
  console.log('commandsPath exists:', fs.existsSync(commandsPath));
  if (fs.existsSync(commandsPath)) console.log('commands files:', fs.readdirSync(commandsPath));
} catch (e) {
  console.warn('Could not inspect commands folder:', e);
}

// Startup environment diagnostics (masked token, presence of CLIENT_ID)
try {
  const hasToken = !!process.env.TOKEN;
  const hasClientId = !!process.env.CLIENT_ID;
  const masked = hasToken ? (`***${String(process.env.TOKEN).slice(-6)}`) : 'NONE';
  console.log('env: TOKEN present?', hasToken, 'masked_suffix:', masked, 'CLIENT_ID present?', hasClientId);
  console.log('Loaded command files count:', client.commands.size);
} catch (e) {
  console.warn('Could not print env diagnostics:', e);
}

// Auto-register commands with Discord on startup (helps when deploying to Railway)
async function registerCommands() {
  try {
    if (!process.env.TOKEN || !process.env.CLIENT_ID) {
      console.log('Skipping auto-registration: missing TOKEN or CLIENT_ID');
      return;
    }
    // Re-scan commands directory at registration time so deployments that
    // didn't contain ./commands at startup can still register commands if
    // they exist at runtime (e.g., found at repo root or later added).
    const commands = [];
    const commandNames = [];
    const path = require('path');
    const commandsDir = path.resolve(__dirname, 'commands');
    let filesToLoad = [];
    if (fs.existsSync(commandsDir)) {
      filesToLoad = fs.readdirSync(commandsDir).filter(f => f.endsWith('.js'));
      console.log('registerCommands: found command files in ./commands:', filesToLoad);
    } else {
      // fallback: look for possible command files at repo root
      const rootFiles = fs.readdirSync(__dirname).filter(f => f.endsWith('.js'));
      const exclude = new Set(['index.js', 'deploy-commands.js', 'missionData.js', 'package.json']);
      filesToLoad = rootFiles.filter(f => !exclude.has(f));
      if (filesToLoad.length) console.log('registerCommands: found command files at repo root:', filesToLoad);
    }

    for (const file of filesToLoad) {
      try {
        const filePath = fs.existsSync(commandsDir) ? path.join(commandsDir, file) : path.join(__dirname, file);
        const command = require(filePath);
        if (command && command.data) {
          commands.push(command.data.toJSON());
          commandNames.push(command.data.name || file);
        }
      } catch (err) {
        console.warn('registerCommands: failed to load command', file, err && err.message);
      }
    }
    if (!commands.length) {
      console.log('No commands to register.');
      return;
    }

    const { REST, Routes } = require('discord.js');
    const rest = new REST({ version: '10' }).setToken(process.env.TOKEN);

    console.log('Registering commands with Discord...');
    console.log('Commands to register:', commandNames);
    if (process.env.GUILD_ID) {
      await rest.put(Routes.applicationGuildCommands(process.env.CLIENT_ID, process.env.GUILD_ID), { body: commands });
      console.log('Successfully registered guild commands for GUILD_ID:', process.env.GUILD_ID);
      console.log('Registered commands:', commandNames);
    } else {
      await rest.put(Routes.applicationCommands(process.env.CLIENT_ID), { body: commands });
      console.log('Successfully registered global commands. (Note: propagation can take up to an hour)');
      console.log('Registered commands:', commandNames);
    }
  } catch (err) {
    console.error('Failed to register commands:', err);
  }
}

// Trigger registration (don't block startup)
registerCommands().catch(err => console.error('registerCommands failed:', err));

client.once("clientReady", async () => {
  console.log(`✅ Logged in as ${client.user.tag}`);

  // Re-load commands from filesystem at ready time (in case they appeared after startup)
  try {
    loadCommandsFromFs();
    console.log('clientReady: loaded commands:', Array.from(client.commands.keys()));
  } catch (err) {
    console.warn('clientReady: failed to re-load commands:', err && err.message);
  }

  // Auto-register commands using the client application (works when bot is ready)
  try {
    const commands = client.commands.map(cmd => cmd.data?.toJSON()).filter(Boolean);
    if (!commands.length) {
      console.log('No commands found to register via client.application.');
      return;
    }

    if (process.env.GUILD_ID) {
      // Try to register as guild commands for instant availability in that guild
      let guild = client.guilds.cache.get(process.env.GUILD_ID);
      if (!guild) {
        guild = await client.guilds.fetch(process.env.GUILD_ID).catch(() => null);
      }
      if (guild) {
        await guild.commands.set(commands);
        console.log(`✅ Slash commands registered to guild ${process.env.GUILD_ID}`);
        console.log('Registered commands:', commands.map(c => c.name));
      } else {
        // Fallback to global registration
        await client.application.commands.set(commands);
        console.log('✅ Global slash commands registered (fallback)');
        console.log('Registered commands:', commands.map(c => c.name));
      }
    } else {
      // Register global commands (may take up to an hour to propagate)
      await client.application.commands.set(commands);
      console.log('✅ Global slash commands registered');
      console.log('Registered commands:', commands.map(c => c.name));
    }
  } catch (error) {
    console.error('❌ Failed to register commands:', error);
  }
});

// --- Railway / PaaS helpers ---
// Ensure DISCORD_TOKEN (or TOKEN) is set via environment (Railway provides project variables)
const DISCORD_TOKEN = process.env.DISCORD_TOKEN || process.env.TOKEN;
if (!DISCORD_TOKEN) {
  console.error('❌ Missing DISCORD_TOKEN in environment. Set DISCORD_TOKEN in Railway secrets or in your .env (do NOT commit it).');
  process.exit(1);
}

// Lightweight HTTP health check server so Railway can keep the service alive
const PORT = process.env.PORT || 3000;
http.createServer(async (req, res) => {
  try {
    const url = req.url || '';
    if (url === '/health') {
      res.writeHead(200, { 'Content-Type': 'text/plain' });
      res.end('OK');
      return;
    }

    // Protected registration endpoint: POST /register-commands with header x-register-secret
    if (url.startsWith('/register-commands')) {
      const secret = process.env.REGISTER_SECRET;
      if (!secret) {
        res.writeHead(403, { 'Content-Type': 'text/plain' });
        res.end('Registration endpoint is disabled (no REGISTER_SECRET configured)');
        return;
      }
      // only allow POST
      if (req.method !== 'POST') {
        res.writeHead(405, { 'Content-Type': 'text/plain' });
        res.end('Method Not Allowed');
        return;
      }
      const provided = req.headers['x-register-secret'];
      if (!provided || provided !== secret) {
        res.writeHead(401, { 'Content-Type': 'text/plain' });
        res.end('Unauthorized');
        return;
      }

      // trigger registration
      try {
        await registerCommands();
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ ok: true, message: 'Registration triggered' }));
      } catch (err) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ ok: false, error: err && err.message }));
      }
      return;
    }

    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('Bot is running');
  } catch (e) {
    res.writeHead(500, { 'Content-Type': 'text/plain' });
    res.end('Error');
  }
}).listen(PORT, () => console.log(`🔌 Health server listening on port ${PORT}`));

// Graceful shutdown to let Railway restart cleanly
const shutdown = async (signal) => {
  console.log(`Received ${signal}, shutting down...`);
  try {
    await client.destroy();
  } catch (err) {
    console.error('Error while destroying client:', err);
  }
  process.exit(0);
};
process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));

process.on('unhandledRejection', (reason) => {
  console.error('Unhandled Rejection:', reason);
});
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
  process.exit(1);
});

console.log(`💓 initial heartbeat: ${new Date().toISOString()} PID:${process.pid} BOT_DIR:${process.env.BOT_DIR||'N/A'} PORT:${process.env.PORT||'N/A'} TOKEN:${process.env.DISCORD_TOKEN||process.env.TOKEN? 'present':'missing'}`);
setInterval(() => console.log(`💓 heartbeat: ${new Date().toISOString()} PID:${process.pid}`), 30 * 1000);
process.on('beforeExit', (code) => console.log(`🧾 beforeExit with code ${code} PID:${process.pid}`));
process.on('exit', (code) => console.log(`🔚 Process exiting with code ${code} PID:${process.pid}`));

client.on("interactionCreate", async (interaction) => {
  if (!interaction.isChatInputCommand()) return;

  const command = client.commands.get(interaction.commandName);
  if (!command) return;

  try {
    await command.execute(interaction);
  } catch (error) {
    console.error(error);

    // If the interaction has already been replied to or deferred, use followUp.
    // Otherwise, send a normal reply. This avoids calling followUp when it's not allowed
    // and prevents crashes when the interaction token is unknown/expired.
    try {
      if (interaction.replied || interaction.deferred) {
        await interaction.followUp({ content: "❌ Error executing command!", ephemeral: true });
      } else {
        await interaction.reply({ content: "❌ Error executing command!", ephemeral: true });
      }
    } catch (err) {
      // If the interaction is unknown (timeout) or already acknowledged, log and skip
      if (err.code === 10062 || err.code === 40060 || err.name === 'InteractionNotReplied') {
        console.warn('Could not send error response to interaction:', err.code || err.name);
      } else {
        console.error('Failed to notify user about the error:', err);
      }
    }
  }
});

client.login(process.env.TOKEN);