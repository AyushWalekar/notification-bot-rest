import { AdaptiveCards } from "@microsoft/adaptivecards-tools";
import { TeamsInfo } from "botbuilder";
import { SlackMessageTypeMiddleware } from "botbuilder-adapter-slack";
import * as restify from "restify";
import notificationTemplate from "./adaptiveCards/notification-default.json";
import { CardData } from "./cardModels";
import config from "./internal/config";
import { notificationApp, slackAdapter } from "./internal/initialize";
import { TeamsBot } from "./teamsBot";

// Create HTTP server.
const server = restify.createServer();
server.use(restify.plugins.queryParser());
server.use(restify.plugins.bodyParser());
server.listen(process.env.port || process.env.PORT || 3978, () => {
  console.log(`\nApp Started, ${server.name} listening to ${server.url}`);
});

// Register an API endpoint with `restify`.
//
// This endpoint is provided by your application to listen to events. You can configure
// your IT processes, other applications, background tasks, etc - to POST events to this
// endpoint.
//
// In response to events, this function sends Adaptive Cards to Teams. You can update the logic in this function
// to suit your needs. You can enrich the event with additional data and send an Adaptive Card as required.
//
// You can add authentication / authorization for this API. Refer to
// https://aka.ms/teamsfx-notification for more details.
server.post(
  "/api/notification",
  restify.plugins.queryParser(),
  restify.plugins.bodyParser(), // Add more parsers if needed
  async (req, res) => {
    // By default this function will iterate all the installation points and send an Adaptive Card
    // to every installation.
    const pageSize = 100;
    let continuationToken: string | undefined = undefined;
    do {
      const pagedData =
        await notificationApp.notification.getPagedInstallations(
          pageSize,
          continuationToken
        );
      const installations = pagedData.data;
      continuationToken = pagedData.continuationToken;

      for (const target of installations) {
        await target.sendAdaptiveCard(
          AdaptiveCards.declare<CardData>(notificationTemplate).render({
            title: "New Event Occurred!",
            appName: "Contoso App Notification",
            description: `This is a sample http-triggered notification to ${target.type}`,
            notificationUrl: "https://aka.ms/teamsfx-notification-new",
          })
        );

        // Note - you can filter the installations if you don't want to send the event to every installation.

        /** For example, if the current target is a "Group" this means that the notification application is
         *  installed in a Group Chat.
        if (target.type === NotificationTargetType.Group) {
          // You can send the Adaptive Card to the Group Chat
          await target.sendAdaptiveCard(...);
  
          // Or you can list all members in the Group Chat and send the Adaptive Card to each Team member
          const pageSize = 100;
          let continuationToken: string | undefined = undefined;
          do {
            const pagedData = await target.getPagedMembers(pageSize, continuationToken);
            const members = pagedData.data;
            continuationToken = pagedData.continuationToken;

            for (const member of members) {
              // You can even filter the members and only send the Adaptive Card to members that fit a criteria
              await member.sendAdaptiveCard(...);
            }
          } while (continuationToken);
        }
        **/

        /** If the current target is "Channel" this means that the notification application is installed
         *  in a Team.
        if (target.type === NotificationTargetType.Channel) {
          // If you send an Adaptive Card to the Team (the target), it sends it to the `General` channel of the Team
          await target.sendAdaptiveCard(...);
  
          // Alternatively, you can list all channels in the Team and send the Adaptive Card to each channel
          const channels = await target.channels();
          for (const channel of channels) {
            await channel.sendAdaptiveCard(...);
          }
  
          // Or, you can list all members in the Team and send the Adaptive Card to each Team member
          const pageSize = 100;
          let continuationToken: string | undefined = undefined;
          do {
            const pagedData = await target.getPagedMembers(pageSize, continuationToken);
            const members = pagedData.data;
            continuationToken = pagedData.continuationToken;

            for (const member of members) {
              // You can even filter the members and only send the Adaptive Card to members that fit a criteria
              await member.sendAdaptiveCard(...);
            }
          } while (continuationToken);
        }
        **/

        /** If the current target is "Person" this means that the notification application is installed in a
         *  personal chat.
        if (target.type === NotificationTargetType.Person) {
          // Directly notify the individual person
          await target.sendAdaptiveCard(...);
        }
        **/
      }
    } while (continuationToken);

    /** You can also find someone and notify the individual person
    const member = await notificationApp.notification.findMember(
      async (m) => m.account.email === "someone@contoso.com"
    );
    await member?.sendAdaptiveCard(...);
    **/

    /** Or find multiple people and notify them
    const members = await notificationApp.notification.findAllMembers(
      async (m) => m.account.email?.startsWith("test")
    );
    for (const member of members) {
      await member.sendAdaptiveCard(...);
    }
    **/

    res.json({});
  }
);

// Register an API endpoint with `restify`. Teams sends messages to your application
// through this endpoint.
//
// The Teams Toolkit bot registration configures the bot with `/api/messages` as the
// Bot Framework endpoint. If you customize this route, update the Bot registration
// in `/templates/provision/bot.bicep`.
const teamsBot = new TeamsBot();
server.post("/api/messages", async (req, res) => {
  await notificationApp.requestHandler(req, res, async (context) => {
    await teamsBot.run(context);
  });
});

// ----------------- slack + teams -----------------
const axios = require("axios");

const slackBotToken = config.slackBotUserToken;
const slackClientId = config.slackClientId;
const slackClientSecret = config.slackClientSecret;

const teamsAppId = "";
const teamsAppPassword = "YOUR_TEAMS_APP_PASSWORD";

// In-memory storage for simplicity. In production, use a database.
const userStorage = {};

// Create the Teams adapter
const teamsAdapter = notificationApp.adapter;
// const teamsAdapter = new TeamsAdapter({
//   appId: appId,
//   appPassword: appPassword,
// });

// // Create the Slack adapter
// const slackAdapter = new SlackAdapter({
//   // Add your Slack app credentials here
//   clientId: "<your-client-id>",
//   clientSecret: "<your-client-secret>",
//   clientSigningSecret: "<your-signing-secret>",
//   botToken: "<your-bot-token>",
// });

// Use SlackMessageTypeMiddleware to process Slack specific message types
slackAdapter.use(new SlackMessageTypeMiddleware());

// Slack OAuth Redirect URI
const slackRedirectUri = `${config.botEndpoint}/slack/oauth`;

// Teams OAuth Redirect URI
const teamsRedirectUri = `${config.botEndpoint}/teams/oauth`;

// OAuth state map for associating state with user IDs
const oauthStateMap = {};

// Teams OAuth middleware
// server.get("/teams/oauth", async (req, res) => {
//   const state = req.query.state;
//   const userId = oauthStateMap[state];

//   try {
//     const tokenResponse = await TeamsInfo.getOAuthToken(req, { state });
//     const user = await TeamsInfo.getUserInfo(req, tokenResponse.token);

//     // Store the user ID in your service
//     userStorage[userId] = { userId: user.id, userName: user.name };

//     res.send(200, "Authentication successful! You can close this window.");
//   } catch (err) {
//     console.error(err);
//     res.send(500, "Authentication failed.");
//   }
// });

// Slack OAuth middleware
server.get("/slack/oauth", async (req, res) => {
  const code = req.query.code;
  const state = req.query.state;
  const userId = oauthStateMap[state];

  try {
    // Exchange the code for an access token
    // const response = await axios.post(
    //   "https://slack.com/api/oauth.v2.access",
    //   {
    //     client_id: slackClientId,
    //     client_secret: slackClientSecret,
    //     code: code,
    //     redirect_uri: slackRedirectUri,
    //     grant_type: "authorization_code",
    //   },
    //   {
    //     headers: {
    //       "Content-Type": "application/x-www-form-urlencoded",
    //     },
    //   }
    // );

    const formData = new URLSearchParams();
    formData.append("client_id", slackClientId);
    formData.append("client_secret", slackClientSecret);
    formData.append("code", code);
    formData.append("redirect_uri", slackRedirectUri);
    formData.append("grant_type", "authorization_code");

    const response = await axios.post(
      "https://slack.com/api/oauth.v2.access",
      formData.toString(),
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
      }
    );

    const accessToken = response.data?.authed_user?.access_token;

    // Call the Slack API to get user information
    const userResponse = await axios.get(
      "https://slack.com/api/users.identity",
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
      }
    );

    const user = userResponse.data;

    // Store the user ID in your service
    userStorage[userId] = { userId: user.user.id, userName: user.user.name };

    res.send(200, "Authentication successful! You can close this window.");
  } catch (err) {
    console.error(err);
    res.send(500, "Authentication failed.");
  }
});

// Trigger proactive message to Teams
// async function sendTeamsProactiveMessage(teamsUserId) {
//   const conversationReference = await teamsAdapter.continueConversation(
//     teamsAppId,
//     teamsUserId,
//     async (context) => {
//       await context.sendActivity("Proactive message from Teams!");
//     }
//   );
// }

// Trigger proactive message to Slack
async function sendSlackProactiveMessage(slackUserId) {
  const conversationReference = await slackAdapter.continueConversation(
    slackUserId,
    async (context) => {
      await context.sendActivity("Proactive message from Slack!");
    }
  );
}

// Example: Install app in Teams
server.get("/install/teams", (req, res, next) => {
  const userId = "unique_user_id"; // Generate a unique user ID in your application

  // Save the user ID and associate it with a unique state
  const state = Math.random().toString(36).substring(7);
  oauthStateMap[state] = userId;

  const teamsInstallUrl = `https://teams.microsoft.com/l/app/${teamsAppId}?state=${state}&user=${userId}`;
  res.redirect(teamsInstallUrl, next);
});

// Example: Install app in Slack
server.get("/install/slack", (req, res, next) => {
  // const userId = "unique_user_id"; // Generate a unique user ID in your application
  const userId = req.query.userId;

  // Save the user ID and associate it with a unique state
  const state = Math.random().toString(36).substring(7);
  oauthStateMap[state] = userId;
  const slackScopes =
    "channels:read,groups:read,im:history,mpim:history,mpim:read,chat:write";
  const userScopes = "identity.basic,identity.email,identity.avatar";
  const slackInstallUrl = `https://slack.com/oauth/v2/authorize?client_id=${slackClientId}&state=${state}&user=${userId}&redirect_uri=${slackRedirectUri}&scope=${slackScopes}&user_scope=${userScopes}`;
  res.redirect(slackInstallUrl, next);
});

//add endpoint to return userStorage
server.get("/userStorage", (req, res, next) => {
  res.json(userStorage);
});

//add endpoint to return slack install url
server.get("/slack/install/url", (req, res, next) => {
  const userId = req.query.userId;
  const state = Math.random().toString(36).substring(7);
  oauthStateMap[state] = userId;
  const slackInstallUrl = `https://slack.com/oauth/v2/authorize?client_id=${slackClientId}&state=${state}&user=${userId}&redirect_uri=${slackRedirectUri}`;
  res.json({ url: slackInstallUrl });
});
