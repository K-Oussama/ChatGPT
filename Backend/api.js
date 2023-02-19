// api.js

const express = require("express");
const redis = require("./redis");
const { Configuration, OpenAIApi } = require('openai');

const router = express.Router();


const { lRange,rPushX, redisClient, Keyexists } = redis.createClient()
redisClient.connect();

async function checkChatHistory() {
  return await Keyexists("chatHistory")
    .then(async (reply) => {
      console.log(reply); // should log 1 if the key exists, and 0 otherwise
      if (reply) {
        console.log("chatHistory key exists");
      } else {
        // If the chat history does not exist, create a new empty chat history in Redis
        await rPushX("chatHistory", JSON.stringify(["🏁"]))
          console.log("chatHistory key created");
      }
    })
    .catch((err) => {
      console.error(err);
    });
}

// Endpoint to handle chat requests
router.get("/chat", async (req, res) => {
  checkChatHistory()
  const chatHistory = await lRange("chatHistory",0,-1);
  if (chatHistory) {
    res.send(chatHistory.map(JSON.parse)); //.map(JSON.parse)
    //console.log("Redis looks gooooood:"+chatHistory)
  } else {
    res.status(404).send("Chat history not found");
  }
});

router.post("/chat", async (req, res) => {
  try {    
    const { prompt, apiKey } = req.body;

    // Retrieve the chat history from Redis
    let chatHistory = []
    try {
      const chatHistoryStr = await lRange("chatHistory",0,-1);
      if (chatHistoryStr) {
        chatHistory = chatHistoryStr; //.map(JSON.parse)
      }
    } catch (error) {
      console.error("Error loading chat history from Redis:", error);
      res.status(500).json({ error: 'Internal server error' });
    }

    const configuration = new Configuration({
      apiKey: apiKey,
    });
    
    const openai = new OpenAIApi(configuration);

    chatHistory.push(prompt);
    //console.log("chatHistory and prompt : "+ chatHistory)

    // Build the API query based on the user's prompt and chat history
    const response = await openai.createCompletion({
      model: "text-davinci-003",
      prompt: chatHistory.join("\n"),//`${prompt}`,
      temperature: 0, // Higher values means the model will take more risks.
      max_tokens: 3000, // The maximum number of tokens to generate in the completion. Most models have a context length of 2048 tokens (except for the newest models, which support 4096).
      top_p: 1, // alternative to sampling with temperature, called nucleus sampling
      frequency_penalty: 0.5, // Number between -2.0 and 2.0. Positive values penalize new tokens based on their existing frequency in the text so far, decreasing the model's likelihood to repeat the same line verbatim.
      presence_penalty: 0, // Number between -2.0 and 2.0. Positive values penalize new tokens based on whether they appear in the text so far, increasing the model's likelihood to talk about new topics.
      //examples: chatHistory, // Join the chat history array into a single string and pass it to OpenAI
    });

    // Extract the chat response from the API response
    const chatResponse = response.data.choices[0].text.trim();
    //console.log("chatResponse: "+chatResponse)

    // Append the user's message and the bot's response to the chat history
    chatHistory.push(chatResponse);
    //console.log("chatHistory:"+chatHistory)

    // Store the chat history in Redis
    try{
        await rPushX("chatHistory", JSON.stringify(prompt), JSON.stringify(chatResponse));
    } catch (error) {
      console.error("Error storing chat history to Redis:", error);
      res.status(500).json({ error: 'Internal server error' });
    }

    // Close the Redis client instance
    //redisClient.quit();

    // Send the chat response back to the frontend
    res.status(200).send({
      bot: chatResponse,
    });

  } catch (error) {
    console.error(error);
    res.status(500).send("Internal server error 500");
  }
});

module.exports = router;
