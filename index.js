import 'dotenv/config';
import { Client, GatewayIntentBits, Collection, REST, Routes, Events } from 'discord.js';
import { createPool } from 'mysql';
import fs from 'fs';

const client = new Client({ intents: [ 
    GatewayIntentBits.AutoModerationConfiguration,
    GatewayIntentBits.DirectMessageTyping,
    GatewayIntentBits.GuildEmojisAndStickers,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildScheduledEvents,
    GatewayIntentBits.Guilds,
    GatewayIntentBits.AutoModerationExecution,
    GatewayIntentBits.DirectMessages,
    GatewayIntentBits.GuildIntegrations,
    GatewayIntentBits.GuildMessageReactions,
    GatewayIntentBits.GuildModeration,
    GatewayIntentBits.GuildVoiceStates,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.DirectMessageReactions,
    GatewayIntentBits.GuildBans,
    GatewayIntentBits.GuildInvites,
    GatewayIntentBits.GuildMessageTyping,
    GatewayIntentBits.GuildPresences,
    GatewayIntentBits.GuildWebhooks]})

/* Function to print the time that anything happens */
function actionTimeRegister(message) {
    const date = new Date()
    let hour = date.getHours();
    let minute = date.getMinutes();
    let second = date.getSeconds();
    if (!message) {
        return `(! -> Añade el mensaje dentro de la función) ${hour}:${minute}:${second}`
    } else {
        return `${hour}:${minute}:${second} ${message}`
    }
}

/* Parameters of the DB connection && establishing the connection with the MySQL DB */
let connection = createPool({
    connectionLimit: 5,
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    database: process.env.DB_NAME,
    password: process.env.DB_PASS,
});

connection.getConnection(function(err, connection){
    if (err) {
        connection.release();
        throw err;
    }
    console.log(`${actionTimeRegister(`Conexión a la base de datos realizada correctamente...`)}`)
});


// Logic Array of commands that the bot gonna process below
client.commands = new Collection();
const commands = [];
const commandsFiles = fs.readdirSync(`./commands`).filter(file => file.endsWith('.js'));

// DON' DELETE THIS FROM THE CODE
// https://stackoverflow.com/questions/74451341/how-to-convert-require-to-import-within-for-loop

for (const file of commandsFiles) {
    const command = await import(`./commands/${file}`);
        
    if ('data' in command && 'execute' in command) {
        commands.push(command.data.toJSON());
    } else {
        console.log(`[WARNING] The command at ${command.data.name} is missing a required "data" or "execute" property.`);
    }
}

const rest = new REST({ version: '10' }).setToken(process.env.SECRET_TOKEN);

    try {
        console.log(`${actionTimeRegister(`Inicio de refresco de los comandos de la aplicación (/).`)}`);
        await rest.put(Routes.applicationCommands(process.env.CLIENT_ID/*, process.env.GUILD_ID*/), { body: commands });
        
        console.log(commands);
        console.log(`${actionTimeRegister(`Refresco de comandos de la aplicación realizado correctamente (/).`)}`);
        } catch (error) {
        console.error(error);
    }

client.on('ready', () => {
    console.log(`${actionTimeRegister(`Bot de Arregla tus Juegos inicializado (?)`)}`);
    client.user.setPresence({activities: [{name: `Unpacking y contando ${client.users.cache.size} decoraciones`}], status: 'online'})
});

client.on(Events.InteractionCreate, async interaction => {
    if (!interaction.isChatInputCommand()) return;
    const command = interaction.client.commands.get(interaction.commandName);
    
    if (!command) {
        console.error(`No command matching ${interaction.commandName} was found.`);
        return;
    }

    try {
        await command.execute(interaction);
    } catch (error) {
        console.error(error);
        if (interaction.replied || interaction.deferred) {
            await interaction.followUp({ content: 'There was an error while executing this command!', ephemeral: true });
        } else {
            await interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true });
        }
    }
});

client.login(process.env.SECRET_TOKEN);