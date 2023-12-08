const config = {
  botId: process.env.BOT_ID,
  botPassword: process.env.BOT_PASSWORD,
  slackClientId: process.env.SLACK_CLIENT_ID,
  slackClientSecret: process.env.SLACK_CLIENT_SECRET,
  slackSigningSecret: process.env.SLACK_SIGNING_SECRET,
  slackVerificationToken: process.env.SLACK_VERIFICATION_TOKEN,
  slackBotUserToken: process.env.SLACK_BOT_USER_TOKEN,
  botEndpoint: "https://4x5m6kfz-3978.inc1.devtunnels.ms",
  mongoDbUri: "mongodb://localhost:27017",
};

export default config;
