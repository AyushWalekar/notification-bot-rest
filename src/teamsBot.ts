import { CardFactory, TeamsActivityHandler } from "botbuilder";
import { getUserMappingByChannelInfo } from "./service/userService";

// An empty teams activity handler.
// You can add your customization code here to extend your bot logic if needed.
export class TeamsBot extends TeamsActivityHandler {
  constructor() {
    super();
    this.onInstallationUpdate(async (context, next) => {
      //send signin card
      const teamsUserId = context.activity.from.id;
      // await this.sendSignInCard(context);
      await next();
    });

    this.onInstallationUpdateAdd(async (context, next) => {
      //send signin card
      const teamsUserId = context.activity.from.id;

      await this.sendSignInCard(context);
      await next();
    });

    this.onMessage(async (context, next) => {
      const teamsUserId = context.activity.from.id;

      // Check if My-Local-Website user ID is associated
      const userMapping = await getUserMappingByChannelInfo(
        teamsUserId,
        "msteams"
      );

      if (context.activity.text === "signin") {
        await this.sendSignInCard(context);
      }

      if (userMapping.userId) {
        // Process user message as usual
        // await this.handleMessage(context, internalUserId);
      } else {
        // Send singing card
        await this.sendSignInCard(context);
      }

      await next();
    });
  }

  async handleMessage(context) {
    const { text } = context.activity;
    //temporary to force singin flow
    if (text === "signin") {
      await this.sendSignInCard(context);
    }
  }

  async sendSignInCard(context) {
    const signInCard = CardFactory.heroCard("Sign in to rtZen", undefined, [
      {
        type: "openUrl",
        title: "Sign In",
        // value: `${config.botEndpoint}/teams/auth/redirect?teamsUserID=${context.activity.from.id}`,
        value: `http://localhost:3978/teams/auth/redirect?teamsUserID=${context.activity.from.id}`,
      },
    ]);

    await context.sendActivity({ attachments: [signInCard] });
  }
}
