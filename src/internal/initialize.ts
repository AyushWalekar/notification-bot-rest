import { BotBuilderCloudAdapter } from "@microsoft/teamsfx";
import ConversationBot = BotBuilderCloudAdapter.ConversationBot;
import config from "./config";
import { SlackAdapter } from "botbuilder-adapter-slack";

// Create bot.
export const notificationApp = new ConversationBot({
  // The bot id and password to create CloudAdapter.
  // See https://aka.ms/about-bot-adapter to learn more about adapters.
  adapterConfig: {
    MicrosoftAppId: config.botId,
    MicrosoftAppPassword: config.botPassword,
    MicrosoftAppType: "MultiTenant",
  },
  // Enable notification
  notification: {
    enabled: true,
  },
});

export const slackAdapter = new SlackAdapter({
  clientId: config.slackClientId,
  clientSecret: config.slackClientSecret,
  clientSigningSecret: config.slackSigningSecret,
  botToken: config.slackBotUserToken,
  oauthVersion: "v2",
  enable_incomplete: true,
});
