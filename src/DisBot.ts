import { Client, ClientOptions } from "discord.js";
import CommandHandler, { CommandHandlerOptions } from "./handlers/CommandHandler";
import EventHandler, { EventHandlerOptions } from "./handlers/EventHandler";

export interface DisBotOptions {
  clientOptions: ClientOptions;
  debug?: boolean;
} 

export default class DisBot {
  debug: boolean = false;

  _client: Client;
  commandManager: CommandHandler;
  eventHandler: EventHandler;

  constructor (options: DisBotOptions, commandHandlerOptions: CommandHandlerOptions, eventHandlerOptions: EventHandlerOptions) {
    if (options.debug !== undefined) this.debug = options.debug;

    this._client = new Client({...options.clientOptions})

    this.commandManager = new CommandHandler(this, this._client, commandHandlerOptions);
    this.eventHandler = new EventHandler(this, eventHandlerOptions);

    this._client.on("ready", async () => {
      console.log("Bot ready, sending commands...");
      // TODO: Better command sending (currectly sending to all guilds (Bad method))
      this._client.guilds.cache.forEach(async (guild) => {
        await this.commandManager.sendCommands(guild.id);
      });
    });
  }
}