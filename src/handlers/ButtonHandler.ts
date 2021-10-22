import DisBot from "../DisBot";
import shortuuid from "short-uuid";
import { ButtonInteraction } from "discord.js/typings/index.js";

export type HandlerFunction = (bot: DisBot, interaction: ButtonInteraction) => any;

class WrappedFunction {
  suuid: string;
  handler: HandlerFunction;
  timestamp: Date = new Date();

  constructor (suuid: string, handler: HandlerFunction) {
    this.suuid = suuid;
    this.handler = handler;
  }

  updateTimestamp() {
    this.timestamp = new Date();
  }

}

export default class ButtonHandler {
  bot: DisBot;
  buttonHandlers: WrappedFunction[];

  constructor (bot: DisBot) {
    this.bot = bot;
    this.buttonHandlers = [];

    this.bot._client.on("interactionCreate", async (interaction) => {
      if (!interaction.isButton()) return;
      let done = false;

      const handler = this.getHandler(interaction.customId);

      if (handler === undefined) return;

      // Automatic defer not working. Looking to wrap the interaction, and check for update to be editReply if defered.
      /*setTimeout(() => {
        if (!done) interaction.deferUpdate();
      }, 2000);

      await handler(this.bot, interaction);
      done = true;*/

      await handler(this.bot, interaction);
    });

    // Garbage Collector :D
    setInterval(() => {
      const newButtons = this.buttonHandlers.filter((wf) => new Date(wf.timestamp.getTime() - 3600000) > wf.timestamp);
      this.buttonHandlers = newButtons;
    }, 5*60*1000);
  }

  createHandler(handler: HandlerFunction): string {
    const suuid = shortuuid.generate();
    const wrappedFunction = new WrappedFunction(suuid, handler);
    this.buttonHandlers.push(wrappedFunction);
    return suuid;
  }

  getHandler(suuid: string): HandlerFunction | undefined {
    const f = this.buttonHandlers.find((f) => f.suuid === suuid);

    if (f !== undefined) {
      f.updateTimestamp();
      return f.handler;
    }
    return undefined;
  }
}