import { GoogleGenAI, Type, Schema } from "@google/genai";
import { ReadingExercise, WritingScenario, WritingFeedback } from "../types";

const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_API_KEY });

const MODEL_NAME = "gemini-3-flash-preview";

// Helper to determine persona based on level
const getLevelContext = (level: number): string => {
  if (level <= 20) {
    return "Level: Beginner (Levels 1-20). The user can barely communicate. Use simple vocabulary, short sentences, and very clear context. Focus on basic bug reports or simple feature questions.";
  } else if (level <= 40) {
    return "Level: Intermediate (Levels 21-40). The user is a standard engineer. Use technical jargon (API, latency, PRs, CI/CD) freely. Focus on code reviews, architectural discussions, and troubleshooting.";
  } else {
    return "Level: Advanced (Levels 41-50). The user is a manager or lead. Use sophisticated language, idioms, and nuance. Focus on negotiation, strategic roadmaps, and conflict resolution.";
  }
};

const READING_SCHEMA: Schema = {
  type: Type.OBJECT,
  properties: {
    subject: { type: Type.STRING, description: "Email subject line" },
    sender: { type: Type.STRING, description: "Name and role of the sender (e.g., 'Mike, Backend Lead')" },
    body: { type: Type.STRING, description: "The content of the technical email or slack message." },
    questions: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          question: { type: Type.STRING },
          options: { type: Type.ARRAY, items: { type: Type.STRING } },
          correctIndex: { type: Type.INTEGER, description: "Zero-based index of the correct option" },
          explanation: { type: Type.STRING, description: "Why the answer is correct (in Japanese)" }
        },
        required: ["question", "options", "correctIndex", "explanation"]
      }
    }
  },
  required: ["subject", "sender", "body", "questions"]
};

export const generateReadingExercise = async (level: number): Promise<ReadingExercise> => {
  const levelContext = getLevelContext(level);
  const prompt = `Generate a reading comprehension exercise for a software engineer learning English.
  ${levelContext}
  Create a realistic email or message from a colleague about a software product issue or update.
  Include 3 multiple choice comprehension questions.
  IMPORTANT: The 'explanation' for each question must be in Japanese.`;

  const response = await ai.models.generateContent({
    model: MODEL_NAME,
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: READING_SCHEMA,
      systemInstruction: "You are a senior technical English tutor designed to simulate real-world software engineering communication."
    }
  });

  return JSON.parse(response.text!) as ReadingExercise;
};

const SCENARIO_SCHEMA: Schema = {
  type: Type.OBJECT,
  properties: {
    context: { type: Type.STRING, description: "The situation (e.g., 'The production DB is spiking in CPU')" },
    recipientRole: { type: Type.STRING, description: "Who the user is writing to" },
    goal: { type: Type.STRING, description: "What the user needs to achieve (in Japanese)" },
    keyPoints: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Facts that must be included (in Japanese)" }
  },
  required: ["context", "recipientRole", "goal", "keyPoints"]
};

export const generateWritingScenario = async (level: number): Promise<WritingScenario> => {
  const levelContext = getLevelContext(level);
  const prompt = `Generate a writing scenario for a software engineer.
  ${levelContext}
  The user needs to write a message to an overseas colleague.
  
  Format constraints:
  1. 'context' must be in English (simulate a received message/situation).
  2. 'goal' and 'keyPoints' MUST be in Japanese (instructions to the user).`;

  const response = await ai.models.generateContent({
    model: MODEL_NAME,
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: SCENARIO_SCHEMA
    }
  });

  return JSON.parse(response.text!) as WritingScenario;
};

const FEEDBACK_SCHEMA: Schema = {
  type: Type.OBJECT,
  properties: {
    score: { type: Type.INTEGER, description: "Score from 0 to 100 based on clarity, tone, and grammar." },
    critique: { type: Type.STRING, description: "Constructive feedback on the user's writing in Japanese." },
    improvedVersion: { type: Type.STRING, description: "A native-level rewrite of the user's message in English." },
    grammarMistakes: { type: Type.ARRAY, items: { type: Type.STRING }, description: "List of specific grammar or vocabulary errors explained in Japanese." }
  },
  required: ["score", "critique", "improvedVersion", "grammarMistakes"]
};

export const evaluateWriting = async (level: number, scenario: WritingScenario, userDraft: string): Promise<WritingFeedback> => {
  const levelContext = getLevelContext(level);
  const prompt = `Evaluate this English writing submission from a software engineer.
  ${levelContext}
  
  Scenario Context: ${scenario.context}
  Goal (Japanese): ${scenario.goal}
  Recipient: ${scenario.recipientRole}
  
  User's Draft: "${userDraft}"
  
  Output Requirements:
  1. 'score': 0-100.
  2. 'improvedVersion': Natural English rewrite.
  3. 'critique': Provide constructive feedback in Japanese. ALWAYS include example sentences (例文) to illustrate your points.
  4. 'grammarMistakes': Explain errors in Japanese.`;

  const response = await ai.models.generateContent({
    model: MODEL_NAME,
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: FEEDBACK_SCHEMA
    }
  });

  return JSON.parse(response.text!) as WritingFeedback;
};