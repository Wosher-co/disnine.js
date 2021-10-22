import fs from "fs/promises";
import { ApplicationCommand, Client, ClientEvents, Collection, DMChannel, Guild, GuildBan, GuildChannel, GuildEmoji, GuildMember, Interaction, InvalidRequestWarningData, Invite, Message, MessageReaction, NewsChannel, PartialGuildMember, PartialMessage, PartialMessageReaction, PartialUser, Presence, RateLimitData, Role, Snowflake, StageInstance, Sticker, TextBasedChannels, TextChannel, ThreadChannel, ThreadMember, Typing, User, VoiceState } from "discord.js";
import DisBot from "../DisBot";
import { BaseCommand } from "./CommandHandler";

export enum Priority {
  EMERGENCY = 256,
  HIGHEST = 128,
  HIGH = 64,
  NORMAL = 0,
  LOW = -64,
  LOWEST = -128,
}

export interface DisEvents {
  // Extracted from Discord's API. TODO: Needs cleanup:

  // applicationCommandCreate: [command: ApplicationCommand];
  // applicationCommandDelete: [command: ApplicationCommand];
  // applicationCommandUpdate: [oldCommand: ApplicationCommand | null, newCommand: ApplicationCommand];
  channelCreate: [channel: GuildChannel];
  channelDelete: [channel: DMChannel | GuildChannel];
  channelPinsUpdate: [channel: TextBasedChannels, date: Date];
  channelUpdate: [oldChannel: DMChannel | GuildChannel, newChannel: DMChannel | GuildChannel];
  // debug: [message: string];
  // warn: [message: string];
  emojiCreate: [emoji: GuildEmoji];
  emojiDelete: [emoji: GuildEmoji];
  emojiUpdate: [oldEmoji: GuildEmoji, newEmoji: GuildEmoji];
  // error: [error: Error];
  guildBanAdd: [ban: GuildBan];
  guildBanRemove: [ban: GuildBan];
  guildCreate: [guild: Guild];
  guildDelete: [guild: Guild];
  guildUnavailable: [guild: Guild];
  guildIntegrationsUpdate: [guild: Guild];
  guildMemberAdd: [member: GuildMember];
  guildMemberAvailable: [member: GuildMember | PartialGuildMember];
  guildMemberRemove: [member: GuildMember | PartialGuildMember];
  // guildMembersChunk: [
  //   members: Collection<Snowflake, GuildMember>,
  //   guild: Guild,
  //   data: { count: number; index: number; nonce: string | undefined },
  // ];
  guildMemberUpdate: [oldMember: GuildMember | PartialGuildMember, newMember: GuildMember];
  guildUpdate: [oldGuild: Guild, newGuild: Guild];
  inviteCreate: [invite: Invite];
  inviteDelete: [invite: Invite];
  messageCreate: [message: Message];
  messageDelete: [message: Message | PartialMessage];
  messageReactionRemoveAll: [
    message: Message | PartialMessage,
    reactions: Collection<string | Snowflake, MessageReaction>,
  ];
  messageReactionRemoveEmoji: [reaction: MessageReaction | PartialMessageReaction];
  messageDeleteBulk: [messages: Collection<Snowflake, Message | PartialMessage>];
  messageReactionAdd: [reaction: MessageReaction | PartialMessageReaction, user: User | PartialUser];
  messageReactionRemove: [reaction: MessageReaction | PartialMessageReaction, user: User | PartialUser];
  messageUpdate: [oldMessage: Message | PartialMessage, newMessage: Message | PartialMessage];
  presenceUpdate: [oldPresence: Presence | null, newPresence: Presence];
  // rateLimit: [rateLimitData: RateLimitData];
  // invalidRequestWarning: [invalidRequestWarningData: InvalidRequestWarningData];
  ready: [client: Client<true>];
  // invalidated: [];
  roleCreate: [role: Role];
  roleDelete: [role: Role];
  roleUpdate: [oldRole: Role, newRole: Role];
  threadCreate: [thread: ThreadChannel];
  threadDelete: [thread: ThreadChannel];
  threadListSync: [threads: Collection<Snowflake, ThreadChannel>];
  threadMemberUpdate: [oldMember: ThreadMember, newMember: ThreadMember];
  threadMembersUpdate: [
    oldMembers: Collection<Snowflake, ThreadMember>,
    newMembers: Collection<Snowflake, ThreadMember>,
  ];
  threadUpdate: [oldThread: ThreadChannel, newThread: ThreadChannel];
  typingStart: [typing: Typing];
  userUpdate: [oldUser: User | PartialUser, newUser: User];
  voiceStateUpdate: [oldState: VoiceState, newState: VoiceState];
  webhookUpdate: [channel: TextChannel | NewsChannel];
  // interactionCreate: [interaction: Interaction];
  // Shards currently not supported
  // shardDisconnect: [closeEvent: CloseEvent, shardId: number];
  // shardError: [error: Error, shardId: number];
  // shardReady: [shardId: number, unavailableGuilds: Set<Snowflake> | undefined];
  // shardReconnecting: [shardId: number];
  // shardResume: [shardId: number, replayedEvents: number];
  stageInstanceCreate: [stageInstance: StageInstance];
  stageInstanceUpdate: [oldStageInstance: StageInstance | null, newStageInstance: StageInstance];
  stageInstanceDelete: [stageInstance: StageInstance];
  stickerCreate: [sticker: Sticker];
  stickerDelete: [sticker: Sticker];
  stickerUpdate: [oldSticker: Sticker, newSticker: Sticker];

  // Added events
  noPermissions: [member: GuildMember, command: BaseCommand];
}

export type DisEventsNames = keyof DisEvents;

export class BaseListener {
  event: DisEventsNames;
  name: string;
  priority: Priority = Priority.NORMAL;

  constructor(event: DisEventsNames, name: string, priority?: Priority) {
    this.event = event;
    this.name = name;
    if (priority !== undefined) this.priority = priority;
  }

  async execute(bot: DisBot, ...args: any[]): Promise<boolean> {
    console.log(`Event not implemented on ${__filename}`);
    return false;
  }
}

export type EventHandlerOptions = {
  listenersPath: string;
}

export default class EventHandler {
  bot: DisBot;
  listeners: BaseListener[];

  constructor(bot: DisBot, options: EventHandlerOptions) {
    this.bot = bot;
    this.listeners = [];

    console.log("Loading events...");

    // Registering RAW events
    this.bot._client.on("raw", async (packet) => {
      if (
        !["MESSAGE_REACTION_ADD", "MESSAGE_REACTION_REMOVE"].includes(packet.t)
      )
        return;

      const rawchannel = this.bot.channels.cache.get(
        packet.d.channel_id
      );
      if (rawchannel === undefined) return;
      const channel = rawchannel as TextChannel;

      if (channel.messages.cache.has(packet.d.message_id)) return;

      const message = await channel.messages.fetch(packet.d.message_id);
      const emoji = packet.d.emoji.id
        ? `${packet.d.emoji.name}:${packet.d.emoji.id}`
        : packet.d.emoji.name;
      // This gives us the reaction we need to emit the event properly, in top of the message object
      const reaction = message.reactions.cache.get(emoji);
      // Adds the currently reacting user to the reaction's users collection.
      if (reaction)
        reaction.users.cache.set(
          packet.d.user_id,
          this.bot.users.cache.get(packet.d.user_id) as User
        );
      // Check which type of event it is before emitting
      if (packet.t === "MESSAGE_REACTION_ADD") {
        this.bot._client.emit(
          "messageReactionAdd",
          reaction as MessageReaction,
          this.bot.users.cache.get(packet.d.user_id) as User
        );
      }
      if (packet.t === "MESSAGE_REACTION_REMOVE") {
        this.bot._client.emit(
          "messageReactionRemove",
          reaction as MessageReaction,
          this.bot.users.cache.get(packet.d.user_id) as User
        );
      }
    });

    // TODO: Check for other not triggered events.

    // Registering bot events
    const botEvents: (keyof ClientEvents)[] = ["channelCreate", "channelDelete", "channelPinsUpdate", "channelUpdate", "emojiCreate", "emojiDelete", "emojiUpdate", "guildBanAdd", "guildBanRemove", "guildCreate", "guildDelete", "guildUnavailable", "guildIntegrationsUpdate", "guildMemberAdd", "guildMemberAvailable", "guildMemberRemove", "guildMemberUpdate", "guildUpdate", "inviteCreate", "inviteDelete", "messageCreate", "messageDelete", "messageReactionRemoveAll", "messageReactionRemoveEmoji", "messageDeleteBulk", "messageReactionAdd", "messageReactionRemove", "messageUpdate", "presenceUpdate", "ready", "roleCreate", "roleDelete", "roleUpdate", "threadCreate", "threadDelete", "threadListSync", "threadMemberUpdate", "threadMembersUpdate", "threadUpdate", "typingStart", "userUpdate", "voiceStateUpdate", "webhookUpdate", "stageInstanceCreate", "stageInstanceDelete", "stageInstanceUpdate", "stickerCreate", "stickerDelete", "stickerDelete", "stickerUpdate"];
    botEvents.forEach((e) => this.bot._client.on(e, async (...args: any[]) => await this.runEvent(e as DisEventsNames, ...args)))

    this.reloadEvents(options.listenersPath);
  }

  async reloadEvents(path: string) {
    this.listeners = [];

    const files = await fs.readdir(path);

    files.forEach(async (file) => {
      if (file.endsWith(".d.ts") || !(file.endsWith(".ts") || file.endsWith(".js"))) return;

      try {
        const listener = new ((await import(`./../events/${file}`)).default)() as BaseListener;
        this.listeners.push(listener);

        console.log(
          `Loaded listener ${listener.name} listening to ${listener.event}`
        );
      } catch (e) {
        if (this.bot.debug) {
          console.log("=================================");
          console.log(`\nFile "${file} is not a valid listener\n`);
          console.error(e);
          console.log("\n=================================\n");
        } else {
          console.log(`File "${file} is not a valid listener. Remove it from the folder, or fix it.`);
        }
      }
    });
  }

  async findListener(event: string): Promise<BaseListener[]> {
    const lstnrs: BaseListener[] = [];
    this.listeners.find((lstnr) => {
      if (lstnr.event === event) lstnrs.push(lstnr);
    });

    return lstnrs.sort((a, b) => b.priority - a.priority);
  }

  async runEvent(event: DisEventsNames, ...args: any[]) {
    const lstnrs = await this.findListener(event);

    for await (const l of lstnrs) {
      const res = await l.execute(this.bot, args[0]);
      if (res) return;
    }
  }
}
