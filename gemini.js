// Gemini API configuration
const GEMINI = {
  API_KEY: "AIzaSyBddcwS3-65W51-QtaM6oh0IFW4Gb4c8rQ",
  MODEL: "gemini-3-flash-preview",
  API_URL: "https://generativelanguage.googleapis.com/v1beta/models",
  TEMPERATURE: 0.3
};

async function generateWordsData(wordList) {
  const prompt = `For each word below, provide exactly one synonym, one antonym, a short definition (one sentence), and one example sentence using the word.

Words: ${JSON.stringify(wordList)}

Output ONLY valid JSON (no markdown, no code blocks, no explanation). Format:
{"Word1": {"syn": "synonym", "ant": "antonym", "def": "definition", "ex": "example sentence"}, "Word2": {...}}`;

  const url = `${GEMINI.API_URL}/${GEMINI.MODEL}:generateContent?key=${GEMINI.API_KEY}`;

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: GEMINI.TEMPERATURE
      }
    })
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || "API request failed");
  }

  const data = await response.json();

  if (!data.candidates || !data.candidates[0]?.content?.parts?.[0]?.text) {
    throw new Error("Invalid API response format");
  }

  const text = data.candidates[0].content.parts[0].text;

  // Clean up in case Gemini wraps in ```json
  const clean = text.replace(/```json\n?|```\n?/g, "").trim();

  try {
    return JSON.parse(clean);
  } catch (e) {
    throw new Error("Failed to parse word data. Please try again.");
  }
}
