const { config } = require("dotenv");
config();

let client;

async function getAIClient() {
  if (client) return client;

  const { GoogleGenAI } = await import("@google/genai");
  client = new GoogleGenAI({ apiKey: process.env.GOOGLE_GEMINI_KEY });
  return client;
}

/**
 * Generate a code review response from the Gemini model.
 * @param {string} code - The code snippet to review.
 * @returns {Promise<string>} The model's response text.
 */
async function reviewCode(code) {
  const ai = await getAIClient();

  const prompt = `You are a senior code reviewer. Analyze the provided code, point out bugs, security issues, performance problems, and suggest improvements.\n\nCode to review:\n${code}`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
    });

    return response.text;
  } catch (err) {
    const message = err?.message || "Unknown error";
    const status = err?.status || 500;

    // If we are blocked by quota, API key, or rate limiting, return a mock response so the app stays usable.
    const isQuotaError = message.toLowerCase().includes("quota") || status === 429;
    const isApiKeyError = message.toLowerCase().includes("api key") || message.toLowerCase().includes("invalid");

    if (isQuotaError || isApiKeyError) {
      return `⚠️ AI service unavailable (${status}). ${message}\n\n` +
        "[DEV NOTE] This is a mock review response while you resolve your API key/quota issues.\n" +
        "- Ensure billing is enabled and quota is available for Gemini.\n" +
        "- Verify your API key in the .env file.\n\n" +
        "Sample review output:\n" +
        "1) The code is small but lacks error handling.\n" +
        "2) Consider using async/await properly and adding input validation.\n" +
        "3) Provide comments and consistent formatting.\n";
    }

    const body = err?.body || err;
    const errorText = `Gemini API error (${status}): ${message}`;
    const payload = typeof body === "string" ? body : JSON.stringify(body, null, 2);

    throw new Error(`${errorText}\n${payload}`);
  }
}

module.exports = reviewCode;
