import 'dotenv/config';
import { Client, GatewayIntentBits, Collection, REST, Routes } from 'discord.js';
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

// DON' DELETE THIS FROM THE CODE
// https://stackoverflow.com/questions/74451341/how-to-convert-require-to-import-within-for-loop

// Logic Array of commands that the bot gonna process below
client.commands = new Collection();
const commands = [];
const commandFiles = fs.readdirSync(`./commands`).filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
    const command = await import(`./commands/${file}`);
    if ('data' in command && 'execute' in command) {
        commands.push(command.data.toJSON());
        client.commands.set(command.data.name, command);
    } else {
        console.log(`El comando ${command.data.name} tiene propiedades de "data" o "execute" inválidas.`);
    }
}

const rest = new REST({version: '10'}).setToken(process.env.SECRET_TOKEN);

// and deploy your commands!
(async () => {
	try {
        const data = await rest.put(Routes.applicationGuildCommands(process.env.CLIENT_ID, process.env.GUILD_ID),{ body: commands },);
        if (commands.length == 0) 
            console.log(`${actionTimeRegister(`No se inició ningún comando de aplicación`)}`);

        else if (commands.length == 1)
            console.log(`${actionTimeRegister(`Se inició el refresco de ${commands.length} comando de la aplicación (/).`)}`);

        else if (commands.length >= 2)
            console.log(`${actionTimeRegister(`Se inició el refresco de ${commands.length} comandos de la aplicación (/).`)}`);

		// The put method is used to fully refresh all commands in the guild with the current set
        if (data.length == 1)
        console.log(`${actionTimeRegister(`Refresco de ${data.length} comando de la aplicación realizado con éxito (/).`)}`);

        else if (data.length >=2)
		console.log(`${actionTimeRegister(`Refresco de ${data.length} comandos de la aplicación realizado con éxito (/).`)}`);
	} catch (error) {
		// And of course, make sure you catch and log any errors!
		console.error(error);
	}
})();

client.on('ready', () => {
    console.log(`${actionTimeRegister(`Bot de Arregla tus Juegos inicializado (?)`)}`);
    client.user.setPresence({activities: [{name: `Unpacking y contando ${client.users.cache.size} decoraciones`}], status: 'online'})
});

client.on('interactionCreate', async interaction => {
    if (!interaction.isChatInputCommand()) return;
    const command = interaction.client.commands.get(interaction.commandName);

    if (!command) {
        console.error(`${actionTimeRegister(`No hay un comando que concuerde con: ${interaction.commandName}.`)}`);
        return;
    }

    try {
        await command.execute(interaction);
    } catch (error) {
        console.error(error);
        if (interaction.replied || interaction.deferred) {
            await interaction.followUp({ content: `¡Ha habido un error mientras ejecutabas este comando!`, ephemeral: true });
        } else {
            await interaction.reply({ content: `¡Ha habido un error mientras ejecutabas este comando!`, ephemeral: true });
        }
    }
});

client.login(process.env.SECRET_TOKEN);