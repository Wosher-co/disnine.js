import DisBot from "./DisBot";
import { BaseCommand, BaseSubcommand } from "./handlers/CommandHandler";
import { BaseListener } from "./handlers/EventHandler";

const modules = {
  DisBot,
  BaseCommand,
  BaseSubcommand,
  BaseListener,
};

export default modules;

export {
  DisBot,
  BaseCommand,
  BaseSubcommand,
  BaseListener,
};