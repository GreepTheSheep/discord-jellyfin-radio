import fs from 'fs';
import { pathToFileURL } from 'node:url';
import Command from './structures/Command.js';

/**
 * Fetch all commands from the commands folder
 * @returns {Promise<Command[]>} The list of commands
 */
export default async function fetchAllCommands(){
    const arr=[];
    const commandFiles = fs.readdirSync('./src/commands');
    for (const file of commandFiles) {
        // if file is a directory, take as category
        if (fs.statSync(`./src/commands/${file}`).isDirectory()) {
            const categoryCommands = fs.readdirSync(`./src/commands/${file}`);
            for (const categoryCommand of categoryCommands) {
                // take only if file is a JS file
                if (categoryCommand.endsWith('.js')) {
                    const module = await import(pathToFileURL(`./src/commands/${file}/${categoryCommand}`).href);
                    arr.push(new Command(module, file));
                }
            }
        } else {
            if (file.endsWith('.js')) {
                const module = await import(pathToFileURL(`./src/commands/${file}`).href);
                arr.push(new Command(module));
            }
        }
    }
    console.log(`⌨️  ${arr.length} commands loaded`);
    return arr;
}
