import { AdaptiveCards } from "@microsoft/adaptivecards-tools";
import { Activity, CardFactory, TurnContext } from "botbuilder";
import { SlackMessageTypeMiddleware } from "botbuilder-adapter-slack";
import fs from "fs";
import * as restify from "restify";
import notificationTemplate from "./adaptiveCards/notification-default.json";
import { CardData } from "./cardModels";
import { connectToMongo } from "./db";
import config from "./internal/config";
import { notificationApp, slackAdapter } from "./internal/initialize";
import { UserMapping } from "./model/UserMapping";
import {
  getUserMappingByChannelInfo,
  getUserMappingByUserIdChannel,
  upsertUserMapping,
} from "./service/userService";
import slackTemplate from "./slack/slackTemplate";
import { TeamsBot } from "./teamsBot";
import util from "./util";
import { log } from "console";
require("dotenv").config();

const BASE_RTZEN_APP_URL = "http://localhost:3000";
const RTZEN_LOGIN_PATH = "user-auth";

connectToMongo();
// Create HTTP server.
const server = restify.createServer();
server.use(restify.plugins.queryParser());
server.use(restify.plugins.bodyParser());
server.listen(process.env.port || process.env.PORT || 3978, () => {
  console.log(`\nApp Started, ${server.name} listening to ${server.url}`);
});
function writeDataToFile(data: any, filePath: string) {
  fs.writeFileSync(filePath, JSON.stringify(data));
}
function readDataFromFile(filePath: string) {
  try {
    const fileData = fs.readFileSync(filePath, "utf-8");
    return JSON.parse(fileData);
  } catch (e) {
    return {};
  }
}

const filePath = "data.json"; // Specify the file path where the data is stored
const userIdVsConversationReference = readDataFromFile(filePath);
const rtzenUserIdVsChannelUserInfo = readDataFromFile(
  "rtzenuserIdVsChannelUserInfo.json"
);

function addConversationReference(userId: string, conversationReference: any) {
  userIdVsConversationReference[userId] = conversationReference;
  writeDataToFile(userIdVsConversationReference, filePath);
}

function addRtzenUserIdVsChannelUserInfo(userId: string, channelUserInfo: any) {
  rtzenUserIdVsChannelUserInfo[userId] = channelUserInfo;
  writeDataToFile(
    rtzenUserIdVsChannelUserInfo,
    "rtzenuserIdVsChannelUserInfo.json"
  );
}

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
    const { channel, userId, payload } = req.body;
    const userMapping = await getUserMappingByUserIdChannel(userId, channel);

    if (channel === "slack") {
      await sendSlackProactiveMessage(userMapping, payload);
      return;
    }
    if (channel === "msteams") {
      await sendTeamsProactiveMessage(userMapping, payload);
      return;
    }
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
          AdaptiveCards.declare<CardData>(notificationTemplate).render(
            req?.body?.payload || {
              title: "New Event Occurred!",
              appName: "Contoso App Notification",
              description: `This is a sample http-triggered notification to ${target.type}`,
              notificationUrl: "https://aka.ms/teamsfx-notification-new",
            }
          )
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
    // if (context.activity.type === "message") {
    // Handle incoming messages
    // await teamsBot.run(context);
    await handleIncomingMessage(context);
    // }
  });
});

server.post("/api/messages/slack", async (req, res) => {
  const isSlackChallenge = req.body.type === "url_verification";

  if (isSlackChallenge) {
    // Respond to Slack challenge
    const challenge = req.body.challenge;
    res.send(challenge);
    return;
  }
  slackAdapter.processActivity(req, res, async (context) => {
    if (context.activity.type === "message") {
      // Handle incoming messages
      await handleIncomingMessage(context);
    }
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

// Use SlackMessageTypeMiddleware to process Slack specific message types
slackAdapter.use(new SlackMessageTypeMiddleware());

// Slack OAuth Redirect URI
const slackRedirectUri = `${config.botEndpoint}/slack/oauth`;

// Teams OAuth Redirect URI
const teamsRedirectUri = `${config.botEndpoint}/teams/oauth`;

// OAuth state map for associating state with user IDs
const oauthStateMap = {};

server.get("/teams/auth/redirect", (req, res, next) => {
  try {
    const teamsUserID = req.query.teamsUserID;

    // Save the user ID and associate it with a unique state
    const state = Math.random().toString(36).substring(7);
    oauthStateMap[state] = teamsUserID;
    const callbackUrl = `${config.botEndpoint}/teams/oauth/callback?state=${state}`;

    const authRedirectUrl = `${BASE_RTZEN_APP_URL}/${RTZEN_LOGIN_PATH}?redirectUrl=${encodeURIComponent(
      callbackUrl
    )}`;
    res.redirect(authRedirectUrl, next);
  } catch (err) {
    console.error(err);
    res.send(500, "Authentication failed.");
  }
});

//Teams Auth callback
server.get("/teams/oauth/callback", async (req, res) => {
  const state = req.query.state;
  const userId = req.query.userId;
  const teamsUserId = oauthStateMap[state];

  try {
    // Store the user ID in your service
    addRtzenUserIdVsChannelUserInfo(userId, {
      ...rtzenUserIdVsChannelUserInfo[userId],
      teams: {
        userId: teamsUserId,
      },
    });
    const existingUserMaping = await getUserMappingByChannelInfo(
      teamsUserId,
      "msteams"
    );
    const userMapping: UserMapping = {
      ...existingUserMaping,
      userId: userId,
      channel: "msteams",
      channelUserId: teamsUserId,
      // TODO: preserve other info like teamsId, channelId etc.
    };
    await upsertUserMapping(userMapping);
    //send message to teams user that "signed in"
    await sendTeamsProactiveMessage(userMapping, "You are signed in!");
    res.send(200, "Authentication successful! You can close this window.");
  } catch (err) {
    console.error(err);
    res.send(500, "Authentication failed.");
  }
});

// Slack OAuth middleware
server.get("/slack/oauth", async (req, res) => {
  const code = req.query.code;
  const state = req.query.state;
  const userId = oauthStateMap[state];

  try {
    // Exchange the code for an access token
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
    userStorage[userId] = {
      slack: {
        user: user.user,
        team: user.team,
        accessToken: accessToken,
      },
    };

    const existingUserMaping = await getUserMappingByChannelInfo(
      user.user.id,
      "slack"
    );

    const userMapping: UserMapping = {
      ...existingUserMaping,
      userId: userId,
      channel: "slack",
      channelUserId: user.user.id,
      metadata: user,
      // TODO: preserve other info like teamsId, channelId etc.
    };
    await upsertUserMapping(userMapping);

    res.send(200, "Authentication successful! You can close this window.");
  } catch (err) {
    console.error(err);
    res.send(500, "Authentication failed.");
  }
});

// Trigger proactive message to Teams
async function sendTeamsProactiveMessage(userMapping, payload) {
  await notificationApp.adapter.continueConversationAsync(
    config.botId,
    userMapping.conversationReference,
    async (context) => {
      if (typeof payload !== "string") {
        payload = CardFactory.adaptiveCard(payload);
      }
      await context.sendActivity({ attachments: [payload] });
    }
  );
}

// Example: Install app in Teams
server.get("/install/teams", (req, res, next) => {
  const userId = req.query.userId; // Generate a unique user ID in your application

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

// Trigger proactive message to Slack
async function sendSlackProactiveMessage(slackUserId, message) {
  const messageToSend = slackTemplate.billApprovalTemplate({ ...message });

  await slackAdapter.continueConversation(
    userIdVsConversationReference[slackUserId],
    async (context) => {
      // await context.sendActivity(message);
      await context.sendActivity({
        type: "message",
        text: "New bill approval slack bot", // You can customize this text
        channelData: {
          ...messageToSend,
        },
      });
    }
  );
}

//write endpoint to sendp proactive msg to slack
server.post("/slack/proactive", async (req, res) => {
  const slackUserId = req.body.slackUserId;
  const slackMessage = req.body.slackMessage;
  await sendSlackProactiveMessage(slackUserId, slackMessage);
  res.json({ status: "success" });
});

async function handleIncomingMessage(context) {
  const channelUserId = context.activity.from.id;
  // Extract conversation reference
  const conversationReference = TurnContext.getConversationReference(
    context.activity
  );
  let userMapping: Partial<UserMapping> = await getUserMappingByChannelInfo(
    channelUserId,
    context.activity.channelId
  );
  if (!userMapping) {
    userMapping = {
      channel: context.activity.channelId,
      channelUserId: channelUserId,
    };
  }
  userMapping.conversationReference = conversationReference;
  await upsertUserMapping(userMapping);

  if (context.activity.channelId === "msteams") {
    await teamsBot.run(context);
  }

  if (context.activity.channelId === "slack") {
    //TODO:
    // await handleIncomingSlackMessage(context);
  }

  if (context.activity.type !== "message") {
    console.log("not a message: ", context.activity.type, context.activity);
    return;
  }

  if (!(await isUserSignedIn(context))) {
    // handleSignIn(context);
    return;
  }

  addConversationReference(
    conversationReference.user.id,
    conversationReference
  );

  // if message = "hello", reply with "hello, how can i help you"
  if (context.activity.text?.includes("hello")) {
    await context.sendActivity("hello, how can i help you");
  }
  if (context.activity.text?.includes("rule")) {
    await context.sendActivity("Working on it...");
    const response = await util.processInput(context.activity.text);
    await context.sendActivity(`There you go: ${response}`);
  }
  await context.sendActivity(
    `Hello! I received your message. Channel: ${conversationReference.channelId}`
  );
}

async function sendProactiveMessage(toUserId, message) {
  if (userIdVsConversationReference[toUserId]) {
    await slackAdapter.continueConversation(
      userIdVsConversationReference[toUserId],
      async (context) => {
        await context.sendActivity(message);
      }
    );
  }
}

async function isUserSignedIn(context) {
  const activity = context.activity as Activity;
  if (activity?.channelId && activity.from.id) {
    const userMapping = await getUserMappingByChannelInfo(
      activity.from.id,
      activity.channelId
    );
    context.userMapping = userMapping;
    return !!userMapping.userId;
  }
  return false;
}
