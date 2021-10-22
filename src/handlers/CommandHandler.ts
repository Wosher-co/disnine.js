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
import path from "path";
import DisBot from "../DisBot";

function getGuildMember(interaction: Interaction): GuildMember | undefined {
  if (interaction.member instanceof GuildMember) {
    return interaction.member as GuildMember;
  }

  return undefined;
}

function hasPermissions(
  member: GuildMember,
  perms?: CommandPermissions
): boolean {
  if (perms === undefined) return true;
  const strict = perms.strict === undefined ? false : perms.strict;

  if (perms.roles !== undefined && perms.roles.length !== 0) {
    let hasAtleastOneRole = false;
    for (const role of perms.roles) {
      if (member.roles.cache.some((r) => r.id === role)) {
        hasAtleastOneRole = true;
      } else {
        if (strict) return false;
      }
    }

    return hasAtleastOneRole;
  }

  if (perms.permissions !== undefined && perms.permissions.length !== 0) {
    let hasAtleastOnePerm = false;
    for (const perm of perms.permissions) {
      if (member.permissions.has(perm)) {
        hasAtleastOnePerm = true;
      } else {
        if (strict) return false;
      }
    }

    return hasAtleastOnePerm;
  }

  return true;
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

export type CommandPermissions = {
  /**
   * Whitelisted roles to use this command.
   */
  roles?: string[];
  /**
   * Needed permissions to use this command. If you're using roles, this will be ignored.
   */
  permissions?: bigint[];
  /**
   * True -> The user must meet all the roles/permissions.
   * False -> The user must meet any of the roles/permissions.
   */
  strict?: boolean;
};

interface Command {
  name: string;
  description: string;
  permission?: CommandPermissions;
  argument: SlashArgument[];

  // TODO: CommandInteraction should be wrapped in a future.
  execute(
    bot: DisBot,
    interaction: CommandInteraction
  ): Promise<boolean | void>;
}

export class BaseCommand implements Command {
  name: string;
  description: string;
  permission?: CommandPermissions;
  /** Will be ignored if using subcommands */
  argument: SlashArgument[];
  /** Arguments will be ignored if this is used */
  subcommands: BaseSubcommand[];
  /**
   * "global" -> Will be registered to all guilds. |
   * string[] -> Array of guild ids that the command will be sent to.
   */
  accessibleFrom: "global" | string[];

  constructor(
    name: string,
    description: string,
    permission?: CommandPermissions,
    argument?: SlashArgument | SlashArgument[],
    subcommands?: BaseSubcommand | BaseSubcommand[],
    accessibleFrom?: "global" | string[]
  ) {
    this.name = name;
    this.description = description;
    if (permission !== undefined) this.permission = permission;

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
  permission?: CommandPermissions;
  argument: SlashArgument[];

  constructor(
    name: string,
    description: string,
    permission?: CommandPermissions,
    argument?: SlashArgument | SlashArgument[]
  ) {
    this.name = name;
    this.description = description;

    if (permission !== undefined) this.permission = permission;

    if (argument === undefined) {
      this.argument = [];
    } else if (argument instanceof SlashArgument) {
      this.argument = [argument];
    } else {
      this.argument = argument;
    }
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

      if (!hasPermissions(member, cmd.permission)) {
        // TODO: Send error event
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

  async reloadCommands(dir: string) {
    this.commands = [];

    const files = await fs.readdir(dir);

    files.forEach(async (file) => {
      if (
        file.endsWith(".d.ts") ||
        !(file.endsWith(".ts") || file.endsWith(".js"))
      )
        return;

      try {
        const command = new (
          await import(path.join(dir, file))
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
        await rest.put(Routes.applicationCommands(this.bot._client.user!.id), {
          body: [slashBuilder],
        });
      } else {
        cmd.accessibleFrom.forEach((guildid) => {
          rest.put(
            Routes.applicationGuildCommands(this.bot._client.user!.id, guildid),
            { body: [slashBuilder] }
          );
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
