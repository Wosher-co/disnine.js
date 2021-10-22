import {
  SlashCommandBooleanOption,
  SlashCommandBuilder,
  SlashCommandChannelOption,
  SlashCommandIntegerOption,
  SlashCommandMentionableOption,
  SlashCommandNumberOption,
  SlashCommandRoleOption,
  SlashCommandStringOption,
  SlashCommandSubcommandBuilder,
  SlashCommandUserOption,
} from "@discordjs/builders";
import { REST } from "@discordjs/rest";
import { Routes } from "discord-api-types/v9";
import {
  Client,
  CommandInteraction,
  GuildMember,
  Interaction,
} from "discord.js";
import fs from "fs/promises";
import DisBot from "../DisBot";

function getGuildMember(interaction: Interaction): GuildMember | undefined {
  if (interaction.member instanceof GuildMember) {
    return interaction.member as GuildMember;
  }

  return undefined;
}

export enum ArgumentType {
  STRING,
  INTEGER,
  NUMBER,
  BOOLEAN,
  USER,
  CHANNEL,
  ROLE,
  MENTIONABLE,
}

export class SlashArgument {
  type: ArgumentType;
  name: string;
  description: string;
  optional: boolean = false;
  choices: [name: string, value: any][] = [];

  constructor(
    type: ArgumentType,
    name: string,
    description: string,
    optional: boolean = false,
    choices: [name: string, value: any][] = []
  ) {
    this.type = type;
    this.name = name;
    this.description = description;
    this.optional = optional;
    this.choices = choices;
  }
}

function processArgument(
  arg: SlashArgument,
  builder: SlashCommandBuilder | SlashCommandSubcommandBuilder
) {
  switch (arg.type) {
    case ArgumentType.STRING:
      builder.addStringOption(
        new SlashCommandStringOption()
          .setName(arg.name)
          .setDescription(arg.name)
          .setRequired(!arg.optional)
          .addChoices(arg.choices)
      );
      return;
    case ArgumentType.INTEGER:
      builder.addIntegerOption(
        new SlashCommandIntegerOption()
          .setName(arg.name)
          .setDescription(arg.name)
          .setRequired(!arg.optional)
          .addChoices(arg.choices)
      );
      return;
    case ArgumentType.NUMBER:
      builder.addNumberOption(
        new SlashCommandNumberOption()
          .setName(arg.name)
          .setDescription(arg.name)
          .setRequired(!arg.optional)
          .addChoices(arg.choices)
      );
      return;
    case ArgumentType.BOOLEAN:
      builder.addBooleanOption(
        new SlashCommandBooleanOption()
          .setName(arg.name)
          .setDescription(arg.name)
          .setRequired(!arg.optional)
      );
      return;
    case ArgumentType.USER:
      builder.addUserOption(
        new SlashCommandUserOption()
          .setName(arg.name)
          .setDescription(arg.name)
          .setRequired(!arg.optional)
      );
      return;
    case ArgumentType.CHANNEL:
      builder.addChannelOption(
        new SlashCommandChannelOption()
          .setName(arg.name)
          .setDescription(arg.name)
          .setRequired(!arg.optional)
      );
      return;
    case ArgumentType.ROLE:
      builder.addRoleOption(
        new SlashCommandRoleOption()
          .setName(arg.name)
          .setDescription(arg.name)
          .setRequired(!arg.optional)
      );
      return;
    case ArgumentType.MENTIONABLE:
      builder.addMentionableOption(
        new SlashCommandMentionableOption()
          .setName(arg.name)
          .setDescription(arg.name)
          .setRequired(!arg.optional)
      );
      return;
  }
}

export enum CommandPermissionType {
  USER,
  ROLE
}

export class CommandPermission {
  type: CommandPermissionType;
  id: string;

  constructor (type: CommandPermissionType, id: string) {
    this.type = type;
    this.id = id;
  }

  static ROLE(id: string) {
    return new this(CommandPermissionType.ROLE, id);
  }

  static USER(id: string) {
    return new this(CommandPermissionType.USER, id);
  }
};

interface Command {
  name: string;
  description: string;
  permission?: CommandPermission[];
  argument: SlashArgument[];
  /**
   * "global" -> Will be registered to all guilds.
   * string[] -> Array of guild ids that the command will be sent to.
   */
  accessibleFrom: "global" | string[];

  // TODO: CommandInteraction should be wrapped in a future.
  execute(
    bot: DisBot,
    interaction: CommandInteraction
  ): Promise<boolean | void>;
}

export class BaseCommand implements Command {
  name: string;
  description: string;
  permission?: CommandPermission[];
  argument: SlashArgument[];
  subcommands: BaseSubcommand[];
  accessibleFrom: "global" | string[];

  constructor(
    name: string,
    description: string,
    permission?: CommandPermission | CommandPermission[],
    argument?: SlashArgument | SlashArgument[],
    subcommands?: BaseSubcommand | BaseSubcommand[],
    accessibleFrom?: "global" | string[]
  ) {
    this.name = name;
    this.description = description;
    if (permission == undefined) {
      this.permission = [];
    } else if (permission instanceof CommandPermission) {
      this.permission = [permission];
    } else {
      this.permission = permission;
    }

    if (argument === undefined) {
      this.argument = [];
    } else if (argument instanceof SlashArgument) {
      this.argument = [argument];
    } else {
      this.argument = argument;
    }

    if (subcommands === undefined) {
      this.subcommands = [];
    } else if (subcommands instanceof BaseSubcommand) {
      this.subcommands = [subcommands];
    } else {
      this.subcommands = subcommands;
    }

    this.accessibleFrom =
      accessibleFrom === undefined ? "global" : accessibleFrom;
  }

  async execute(
    bot: DisBot,
    interaction: CommandInteraction
  ): Promise<boolean | void> {
    console.log(`Command not implemented on ${__filename}`);
    return false;
  }
}

export class BaseSubcommand implements Command {
  name: string;
  description: string;
  permission?: CommandPermission[];
  argument: SlashArgument[];
  accessibleFrom: "global" | string[];

  constructor(
    name: string,
    description: string,
    permission?: CommandPermission | CommandPermission[],
    argument?: SlashArgument | SlashArgument[],
    accessibleFrom?: "global" | string[]
  ) {
    this.name = name;
    this.description = description;

    if (permission == undefined) {
      this.permission = [];
    } else if (permission instanceof CommandPermission) {
      this.permission = [permission];
    } else {
      this.permission = permission;
    }

    if (argument === undefined) {
      this.argument = [];
    } else if (argument instanceof SlashArgument) {
      this.argument = [argument];
    } else {
      this.argument = argument;
    }

    this.accessibleFrom =
      accessibleFrom === undefined ? "global" : accessibleFrom;
  }

  async execute(
    bot: DisBot,
    interaction: CommandInteraction
  ): Promise<boolean | void> {
    console.log(`Subcommand not implemented on ${this.name} -> ${__filename}`);
    return false;
  }
}

export type CommandHandlerOptions = {
  commandsPath: string;
};

export default class CommandHandler {
  bot: DisBot;
  commands: BaseCommand[];

  constructor(bot: DisBot, client: Client, options: CommandHandlerOptions) {
    this.bot = bot;
    this.commands = [];

    console.log("\nLoading commands...");

    client.on("interactionCreate", async (interaction) => {
      if (!interaction.isCommand()) return;

      const cmd = await bot.commandManager.findCommand(interaction.commandName);
      if (cmd === undefined) return;

      const member = getGuildMember(interaction);
      if (member === undefined) {
        return;
      }

      // Executing command
      const result = await cmd.execute(bot, interaction);

      if (result !== undefined && !result) {
        // TODO: Send failed command event
      }
    });

    this.reloadCommands(options.commandsPath);
  }

  async reloadCommands(path: string) {
    this.commands = [];

    const files = await fs.readdir(path);

    files.forEach(async (file) => {
      if (
        file.endsWith(".d.ts") ||
        !(file.endsWith(".ts") || file.endsWith(".js"))
      )
        return;

      try {
        const command = new (
          await import(`./../commands/${file}`)
        ).default() as BaseCommand;

        this.commands.push(command);
        console.log(`Loaded command "${command.name}"`);
      } catch (e) {
        if (this.bot.debug) {
          console.log("=================================");
          console.log(`\nFile "${file} is not a valid command\n`);
          console.error(e);
          console.log("\n=================================\n");
        } else {
          console.log(
            `File "${file} is not a valid command. Remove it from the folder, or fix it.`
          );
        }
      }
    });
  }

  async formatCommand(command: BaseCommand): Promise<SlashCommandBuilder> {
    // Setting basic things for Command
    const slashCommand = new SlashCommandBuilder()
      .setName(command.name)
      .setDescription(command.description);

    // Registering sub commands
    command.subcommands.forEach((subcommand) =>
      slashCommand.addSubcommand((sb) => {
        // Setting basic things for Subcommand
        sb.setName(subcommand.name).setDescription(subcommand.description);

        // Registering args for subcommands
        subcommand.argument.forEach((arg) => {
          processArgument(arg, sb);
        });

        return sb;
      })
    );

    // Setting arguments for command
    command.argument.forEach((arg) => {
      processArgument(arg, slashCommand);
    });
    return slashCommand;
  }

  async sendCommands() {
    this.commands.forEach(async (cmd) => {
      const slashBuilder = await this.formatCommand(cmd);

      const rest = new REST({ version: "9" }).setToken(this.bot._token);

      if (cmd.accessibleFrom === "global") {
        await rest.put(Routes.applicationCommands(this.bot._client.user!.id), {body: [slashBuilder]});
      } else {
        cmd.accessibleFrom.forEach((guildid) => {
          rest.put(Routes.applicationGuildCommands(this.bot._client.user!.id, guildid), {body: [slashBuilder]})
        });
      }
    });
  }

  async findCommand(name: string) {
    return this.commands.find((cmd) => {
      return cmd.name === name;
    });
  }
}
