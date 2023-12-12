const OpenAI = require("openai");
require("dotenv").config();

const apiKey = process.env.API_KEY;

const PY_SERVER_HOST = "http://127.0.0.1:5000";
const PY_SERVER_ENDPOINT = `${PY_SERVER_HOST}/process_user_instruction`;

function logWorkingOnIt() {
  console.log("working on it..");
}

const UI_CLIENT = "https://app.dev.rtzen.com";

async function processInput(userInput) {
  const intervalId = setInterval(logWorkingOnIt, 1000);
  try {
    const body = {
      instruction: userInput,
    };
    const response = await fetch(PY_SERVER_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });
    const json = await response.json();
    console.log(json);
    return json.reply;
  } catch (e) {
    console.error(e);
  } finally {
    clearInterval(intervalId);
  }
}

export = {
  processInput: processInput,
};
