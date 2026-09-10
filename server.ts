import express, { Request, Response } from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const PORT = 3000;

// Lazy initialization of GoogleGenAI client
let aiClient: GoogleGenAI | null = null;
function getGenAI(): GoogleGenAI {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY is not configured in the environment.");
    }
    aiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return aiClient;
}

const SYSTEM_INSTRUCTION = `You are "Zaheer AI", an intelligent, polite, and articulate AI portfolio assistant representing Muhammad Zaheer (Computer Science Student & Software Developer).

Your purpose:
1. Greet visitors warmly and help them explore Muhammad Zaheer's academic background, skills, work, projects, resume, and internship/collaboration options.
2. Provide accurate, concise, and helpful answers based on Muhammad Zaheer's profile:
   - Name: Muhammad Zaheer
   - Role: Computer Science Student & Software Developer
   - Institution: National University of Technology (NUTECH), Islamabad
   - Degree: Bachelor of Science in Computer Science (BS CS)
   - Expected Graduation: June, 2027
   - Technical Stack: Python, C, C++, SQL, Kotlin, JavaScript (ES6+), HTML5, CSS3, Tailwind CSS, Firebase / Cloud Firestore, AI & Machine Learning (data preprocessing with Pandas/NumPy, basic model training), Git/GitHub.
   - Core Projects:
     * Weather Dashboard Pro: Real-time atmospheric analytics with live AQI, UV index, and spatial audio.
     * API Status Dashboard: Real-time telemetry, endpoint health monitor with latency testing and status badges.
     * Interactive Todo Application: Task manager with local storage persistence and priority filtering.
     * Minimal Weather App: Rapid city lookup via Open-Meteo API.
   - Resume & Documents:
     * Full web resume available at resume.html
     * One-click PDF download at resume.html?download=true
   - Contact Info:
     * Email: mzaheer1070@gmail.com
     * Phone: +92-302-3185767
     * Location: Islamabad, Pakistan (Open to local & remote internship opportunities worldwide)
3. Chat demeanor:
   - Confident, professional, humble, enthusiastic about computer science and engineering.
   - Keep answers clear and digestible (2-4 sentences or structured bullet points).
   - If someone asks to hire Muhammad, offer an internship, or download his resume, provide the direct links and contact info (mzaheer1070@gmail.com).
   - You can format responses with clean Markdown (bolding, lists, links).`;

async function startServer() {
  const app = express();
  app.use(express.json({ limit: "2mb" }));

  // Health check endpoint
  app.get("/api/health", (_req: Request, res: Response) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  // Gemini Chat API endpoint (multi-turn conversation)
  app.post("/api/chat", async (req: Request, res: Response) => {
    try {
      const { messages } = req.body;

      if (!messages || !Array.isArray(messages) || messages.length === 0) {
        return res.status(400).json({ error: "Missing or invalid 'messages' array in request body." });
      }

      const ai = getGenAI();

      // Format conversation history for Gemini
      // Format as content parts: role 'user' or 'model'
      const formattedContents = messages.map((m: { role: string; content: string }) => ({
        role: m.role === "assistant" || m.role === "model" ? "model" : "user",
        parts: [{ text: m.content || "" }],
      }));

      // Task mapping per instructions: general tasks use gemini-3.5-flash
      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: formattedContents,
        config: {
          systemInstruction: SYSTEM_INSTRUCTION,
          temperature: 0.7,
        },
      });

      const replyText = response.text || "Hello! How can I assist you with Muhammad Zaheer's portfolio today?";

      return res.json({ reply: replyText });
    } catch (err: any) {
      console.error("Gemini Chat API Error:", err);
      return res.status(500).json({
        error: err?.message || "Failed to generate AI response. Please check your Gemini API configuration.",
      });
    }
  });

  // Vite development middleware vs production static files
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req: Request, res: Response) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
