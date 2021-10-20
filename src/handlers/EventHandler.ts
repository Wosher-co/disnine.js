import fs from "fs/promises";
import { ClientEvents, MessageReaction, TextChannel, User } from "discord.js";
import DisBot from "../DisBot";

export enum Priority {
  EMERGENCY = 256,
  HIGHEST = 128,
  HIGH = 64,
  NORMAL = 0,
  LOW = -64,
  LOWEST = -128,
}

export interface DisEvents {
}

/** Should be moved to DisEvents at some point */
export type EventNames = keyof ClientEvents;

export class BaseListener {
  event: EventNames;
  name: string;
  priority: Priority = Priority.NORMAL;

  constructor(event: EventNames, name: string, priority?: Priority) {
    this.event = event;
    this.name = name;
    if (priority !== undefined) this.priority = priority;
  }

  async execute(bot: DisBot, ...data: ClientEvents[EventNames]): Promise<boolean> {
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
  _alreadyListeningEvent: EventNames[] = [];

  constructor(bot: DisBot, options: EventHandlerOptions) {
    this.bot = bot;
    this.listeners = [];

    console.log("\nLoading events...");

    // Registering RAW events
    this.bot.on("raw", async (packet) => {
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
        this.bot.emit(
          "messageReactionAdd",
          reaction as MessageReaction,
          this.bot.users.cache.get(packet.d.user_id) as User
        );
      }
      if (packet.t === "MESSAGE_REACTION_REMOVE") {
        this.bot.emit(
          "messageReactionRemove",
          reaction as MessageReaction,
          this.bot.users.cache.get(packet.d.user_id) as User
        );
      }
    });

    // TODO: Check for other not triggered events.

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

        if (!(listener.event in this._alreadyListeningEvent)) {
          this.bot.on(listener.event, async (...args: any[]) => {
            await this.runEvent(listener.event, ...args);
          });
          this._alreadyListeningEvent.push(listener.event);
        }

        console.log(
          `Loaded event ${listener.event} - ${listener.name} - Priority: ${listener.priority}`
        );
      } catch (e) {
        if (e instanceof SyntaxError) {
          console.log(`File "${file} is not a valid event`);
        } else {
          console.error(e);
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

  async runEvent(event: EventNames, ...args: any[]) {
    const lstnrs = await this.findListener(event);

    for await (const l of lstnrs) {
      const res = await l.execute(this.bot, args[0]);
      if (res) return;
    }
  }
}
