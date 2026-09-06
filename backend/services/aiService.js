const { GoogleGenAI } = require("@google/genai");

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY
});

const askAI = async (prompt) => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3.6-flash",
      contents: prompt
    });

    return response.text;
  } catch (error) {
    console.error("Gemini AI Error:", error);
    throw error;
  }
};

module.exports = {
  askAI
};