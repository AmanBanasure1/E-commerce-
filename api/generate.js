
export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({
      error: "Only POST requests are allowed."
    });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  const model = "gemini-3.8-flash";

  if (!apiKey || !model) {
    return res.status(500).json({
      error: "Server AI settings are missing."
    });
  }

  const {
    name,
    price,
    category,
    features,
    audience,
    description
  } = req.body || {};

  if (
    typeof name !== "string" ||
    !name.trim() ||
    name.length > 120 ||
    typeof features !== "string" ||
    !features.trim() ||
    features.length > 1500
  ) {
    return res.status(400).json({
      error: "Valid product name and features are required."
    });
  }

  if (
    price === undefined ||
    price === null ||
    price === "" ||
    !Number.isFinite(Number(price)) ||
    Number(price) < 0
  ) {
    return res.status(400).json({
      error: "Enter a valid non-negative price."
    });
  }

  const safeText = (value, max) =>
    typeof value === "string" ? value.slice(0, max) : "";

  const product = {
    name: name.trim(),
    price: Number(price),
    category: safeText(category, 100),
    features: features.trim(),
    audience: safeText(audience, 150),
    description: safeText(description, 2000)
  };

  const prompt = `
You are an e-commerce listing assistant.

Use only the product facts provided below.
Never invent material, sizes, certifications, stock,
discounts, delivery times, reviews or performance claims.
If information is missing, clearly mark it as "Confirm with seller".

Create:
1. Improved product title
2. Clear, original product description
3. Product benefits supported by supplied facts
4. Five relevant SEO keyword suggestions
5. Three customer FAQs with honest answers
6. Missing details the seller should confirm

Do not promise higher sales or guaranteed search rankings.
Write in clear English.

Product data:
${JSON.stringify(product)}
`;

  try {
    const url =
  "https://generativelanguage.googleapis.com/v1beta/models/" +
  encodeURIComponent(model) +
  ":generateContent";

    const apiResponse = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": apiKey
      },
      body: JSON.stringify({
        contents: [{
          parts: [{ text: prompt }]
        }],
        generationConfig: {
          temperature: 0.4,
          maxOutputTokens: 1200
        }
      })
    });

    const data = await apiResponse.json();

    if (!apiResponse.ok) {
  console.error("Gemini API error:", {
    httpStatus: apiResponse.status,
    status: data.error?.status,
    message: data.error?.message
  });

  return res.status(502).json({
    error: "Gemini API failed. HTTP " + apiResponse.status,
    code: data.error?.status || "UNKNOWN",
    details: data.error?.message || "No error details"
  });
    }

    const text = data.candidates?.[0]?.content?.parts
      ?.map(part => part.text || "")
      .join("\n")
      .trim();

    if (!text) {
      return res.status(502).json({
        error: "AI returned no text. Please try again."
      });
    }

    return res.status(200).json({ text });
  } catch (error) {
    console.error("AI request failed:", error.message);
    return res.status(502).json({
      error: "Could not reach the AI service."
    });
  }
}
