const aiService = require("../services/ai.service")

module.exports.getReview = async (req, res) => {
  const code = req.body.code;

  if (!code) {
    return res.status(400).send("Prompt is required");
  }

  try {
    const response = await aiService(code);
    res.send(response);
  } catch (error) {
    // When AI service fails (quota, invalid key, etc.), return a helpful fallback.
    const message = error?.message || "Unknown error";
    res.status(500).json({
      error: "AI service error",
      message,
      fallback: "The AI review is currently unavailable. Please check your API key/quota or try again later.",
    });
  }
};