import { ChannelManager, Client, ClientOptions, ClientUser, ClientVoiceManager, GuildManager, ShardClientUtil, User, UserManager } from "discord.js";
import CommandHandler, { CommandHandlerOptions } from "./handlers/CommandHandler";
import EventHandler, { EventHandlerOptions } from "./handlers/EventHandler";

export interface DisBotOptions {
  clientOptions: ClientOptions;
  debug?: boolean;
} 

export default class DisBot {
  debug: boolean = false;
  _token: string = "";

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
      // Sending commands
      await this.commandManager.sendCommands();
    });
  }

  get guilds(): GuildManager {
    return this._client.guilds
  }

  get users(): UserManager {
    return this._client.users;
  }

  get user(): ClientUser | null {
    return this._client.user;
  }

  get channels(): ChannelManager {
    return this._client.channels;
  }

  get voice(): ClientVoiceManager {
    return this._client.voice;
  }

  /** @deprecated Not supported */
  get shard(): ShardClientUtil | null {
    return this._client.shard;
  }

  get ready(): boolean {
    return this._client.isReady();
  }

  login(token: string): Promise<string> {
    this._token = token;
    return this._client.login(this._token);
  }
}