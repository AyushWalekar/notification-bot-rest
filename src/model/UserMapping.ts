import { ConversationReference } from "botbuilder";

export type Channel = "msteams" | "slack" | string;

export interface UserMapping {
  _id: string;
  userId: string;
  channel: Channel;
  channelUserId: string;
  metadata?: any;
  conversationReference?: Partial<ConversationReference>;
}
