// File: api/generate.js (Corrected with default export)

import "dotenv/config";
import { GoogleGenerativeAI } from "@google/generative-ai";

const YOUTUBE_TAG_CHAR_LIMIT = 460;

function validateAndTrimTags(tags) {
  if (!Array.isArray(tags) || tags.length === 0) return [];
  const validTags = [];
  let currentLength = 0;
  for (const tag of tags) {
    const tagLengthWithComma = tag.length + 1;
    if (currentLength + tagLengthWithComma <= YOUTUBE_TAG_CHAR_LIMIT) {
      validTags.push(tag);
      currentLength += tagLengthWithComma;
    } else {
      break;
    }
  }
  return validTags;
}

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// The only change is adding "default" here
export default async function handler(req, res) {
  console.log(`[INFO] /api/generate function invoked. Method: ${req.method}`);
  const { videoContext, platform, streamerName } = req.body;
  console.log(
    `[INFO] Received data: platform='${platform}', videoContext='${videoContext}', streamerName='${
      streamerName || "N/A"
    }'`
  );

  if (!videoContext || !platform) {
    return res
      .status(400)
      .json({ error: "videoContext and platform are required." });
  }

  try {
    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-flash-latest",
    });

    const jsonStructure = `{
      "titles": ["An array of 10 short, viral, clickable title ideas for the video."],
      "hashtags": ["An array of at least 15 relevant hashtags..."],
      "tags": ["An extensive list of at least 30-40 SEO tags... Be comprehensive."]
    }`;

    const prompt = `
      You are a viral content strategist. Your task is to generate metadata for a video.
      **CRITICAL RULES:**
      1.  If a "streamerName" (${
        streamerName || "N/A"
      }) is provided, write from a fan's third-person perspective.
      2.  Your entire response MUST be a single, valid JSON object.
      **VIDEO CONTEXT:** "${videoContext}"
      **JSON STRUCTURE REQUIRED:** ${jsonStructure}
    `;

    console.log("[INFO] Sending request to Gemini AI...");
    const result = await model.generateContent(prompt);
    const response = result.response;

    if (response.promptFeedback?.blockReason) {
      const reason = response.promptFeedback.blockReason;
      return res
        .status(400)
        .json({ error: `Request blocked by AI due to: ${reason}.` });
    }

    const rawText = response.text();
    if (!rawText) {
      return res
        .status(500)
        .json({ error: "The AI returned an empty response." });
    }

    const cleanedText = rawText.replace(/```json\n|```/g, "").trim();
    const aiData = JSON.parse(cleanedText);

    const callToAction =
      platform === "youtube"
        ? "Make sure to Like and Subscribe for more clips! ❤️"
        : "Like and follow for more! 🔥";

    const hashtags = [];
    const otherHashtags = (aiData.hashtags || []).filter(
      (h) => h && !h.includes("#shorts") && !h.includes("#fyp")
    );
    if (platform === "youtube") {
      hashtags.push("#shorts", ...otherHashtags.slice(0, 6));
    } else {
      hashtags.push("#fyp", ...otherHashtags.slice(0, 7));
      if (platform === "general") {
        hashtags.shift();
      }
    }

    const finalTags =
      platform === "youtube" || platform === "general"
        ? validateAndTrimTags(aiData.tags)
        : [];

    console.log("[INFO] Successfully processed data. Sending 200 OK response.");
    res.status(200).json({
      titles: aiData.titles,
      hashtags: hashtags,
      callToAction: callToAction,
      tags: finalTags,
    });
  } catch (error) {
    console.error("[ERROR] An error occurred in the handler:", error);
    if (error instanceof SyntaxError) {
      return res.status(500).json({
        error: "AI returned malformed data that could not be parsed.",
      });
    }
    res
      .status(500)
      .json({ error: error.message || "An internal server error occurred." });
  }
}
