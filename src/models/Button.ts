import { EmojiIdentifierResolvable, MessageButton, MessageButtonStyleResolvable } from "discord.js/typings/index.js"
import { HandlerFunction } from "../handlers/ButtonHandler";

enum ButtonType {
  NORMAL,
  LINK,
}

export enum ButtonStyle {
  PRIMARY = "PRIMARY",
  SECONDARY = "SECONDARY",
  SUCCESS = "SUCCESS",
  DANGER = "DANGER",
  //LINK = "LINK",
}

// TODO: I think a better use of types can be done here to differenciate between LINK or NORMAL type
export type DisButtonOptions = {
  label: string;
  /** Setting an URL will transform this into a link */
  url?: string;
  style?: ButtonStyle;
  disabled?: boolean;
  emoji?: EmojiIdentifierResolvable;
  handler?: HandlerFunction;
}

export default class DisButton {
  label: string;
  type: ButtonType;
  style: MessageButtonStyleResolvable;
  url?: string;
  disabled?: boolean;
  emoji?: EmojiIdentifierResolvable;
  handler?: HandlerFunction;

  constructor (options: DisButtonOptions) {
    this.label = options.label;
    this.emoji = options.emoji;

    if (options.url !== undefined) {
      this.type = ButtonType.LINK;
      this.style = "LINK";
      this.url = options.url;
    } else {
      this.type = ButtonType.NORMAL;
      this.style = options.style as MessageButtonStyleResolvable;
      this.disabled = options.disabled;
    }
  }

  build(): MessageButton {
    const button = new MessageButton().setLabel(this.label)
    if (this.type === ButtonType.LINK) {

    }
    return button;
  }
}