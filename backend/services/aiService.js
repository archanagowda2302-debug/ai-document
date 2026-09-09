const { GoogleGenAI } = require("@google/genai");

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY
});

const models = [
  process.env.GEMINI_MODEL,
  "gemini-3-flash-preview",
  "gemini-3.1-flash-lite",
  "gemini-flash-lite-latest",
  "gemini-3.5-flash"
].filter(Boolean);

const askAI = async (prompt, config = {}) => {
  let lastError;
  for (const model of models) {
    try {
      const response = await ai.models.generateContent({ model, contents: prompt, config });
      const text = typeof response.text === "function" ? await response.text() : response.text;
      if (typeof text !== "string" || !text.trim()) throw new Error("The AI service returned an empty response.");
      return text.trim();
    } catch (error) {
      lastError = error;
      if (![404, 429, 500, 503].includes(error.status)) throw error;
      console.warn(`AI model ${model} unavailable; trying the next configured model.`);
    }
  }
  console.error("Gemini AI Error: all configured models failed.", lastError?.status || lastError?.message);
  throw lastError || new Error("No AI model is configured.");
};

module.exports = {
  askAI
};
