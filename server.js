// server.js

import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import OpenAI from "openai";

dotenv.config();


const app = express();
app.use(cors());
app.use(express.json());

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// In-memory history: { userId: { chatId: [ {role,content} ] } }
const histories = {};

app.post("/api/chat", async (req, res) => {
  try {
    const { userId, chatId, language, history } = req.body;

    if (!userId || !chatId || !history || !Array.isArray(history)) {
      return res.status(400).json({ error: "Bad request body" });
    }

    if (!histories[userId]) histories[userId] = {};
    histories[userId][chatId] = history;

    const systemPrompt =
      "You are a helpful AI assistant. " +
      "If user language is 'hi', reply in simple Hindi. " +
      "If language is 'en', reply in simple English. " +
      "Be short and clear.";

    const messages = [
      { role: "system", content: systemPrompt },
      ...history,
    ];

    const response = await client.responses.create({
      model: "gpt-4.1-mini",
      input: messages,
    });

    const reply = response.output[0].content[0].text;
    return res.json({ reply });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Server error" });
  }
});

const PORT = 3000;
app.listen(PORT, () => {
  console.log("Server running on port", PORT);
});