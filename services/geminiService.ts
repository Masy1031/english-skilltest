import { GoogleGenAI, Type, Schema } from "@google/genai";
import { ReadingExercise, WritingScenario, WritingFeedback } from "../types";
import { logger } from "./loggerService";

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

const topics = [
  "a critical bug report",
  "a new feature proposal",
  "a code review feedback",
  "a post-mortem analysis",
  "a design document review",
  "a request for technical assistance",
  "a project status update",
  "a discussion about API changes",
  "a database migration plan",
  "a security vulnerability report",
  "a performance optimization suggestion",
  "a hiring process update",
  "a new tool adoption proposal",
  "a technical debt discussion",
  "an incident report",
];

const getRandomTopic = () => topics[Math.floor(Math.random() * topics.length)];

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
  const topic = getRandomTopic();
  logger.info(`Generating reading exercise for level: ${level}, topic: ${topic}`);
  const levelContext = getLevelContext(level);
  const prompt = `You are an AI assistant that creates reading comprehension exercises for a software engineer learning English.
  ${levelContext}
  This time, the situation is about ${topic}.
  
  以下は、適切に構成された読解演習の例です。AIはこの例のトーン、スタイル、複雑さ、および日本語での解説の質に従って生成する必要があります。
  
  --- 例の開始 ---
  Subject: 緊急：データベース移行計画のレビュー
  Sender: アリス、シニアDBA
  Body: チームの皆さん、お元気ですか。主要な本番クラスターのデータベース移行計画案について、緊急のレビューをお願いしたくご連絡しました。ユーザーへの影響を最小限に抑えつつ移行を実行できる、来週土曜日のUTC午前2時から午前5時の間の重要な時間帯を特定しました。計画には、PostgreSQLをバージョン12から14にアップグレードし、シームレスな移行のために論理レプリケーションを活用することが含まれます。主な手順は、新しいPostgreSQL 14インスタンスのセットアップ、現在のPostgreSQL 12プライマリからの論理レプリケーションの構成、データ同期の監視、そして最後にアプリケーションを新しいプライマリに切り替えることです。ステージング環境で広範囲なテストを実施し、プロセスは成功しました。詳細な手順とロールバック手順を概説した添付ドキュメントをご確認ください。計画を最終決定する前に、皆様からのフィードバックが不可欠です。明日のスタンドアップで懸念事項について話し合いましょう。よろしくお願いいたします、アリス。
  
  Questions:
  1. このメールの主な目的は何ですか？
     A) 完了したデータベース移行を発表すること。
     B) データベース移行計画のレビューを依頼すること。
     C) 新しいデータベースシステムを提案すること。
     D) データベースの問題を報告すること。
     Correct Answer: B
     Explanation: このメールの主な目的は、提案されているデータベース移行計画の緊急レビューを依頼することです。
  
  2. 移行を実行するための重要な時間帯はいつですか？
     A) 明日のスタンドアップ。
     B) 来週土曜日のUTC午前2時から午前5時の間。
     C) 営業時間内。
     D) 来週中いつでも。
     Correct Answer: B
     Explanation: 移行の重要な期間は、来週土曜日のUTC午前2時から午前5時の間とされています。
  
  3. PostgreSQLのアップグレード中にシームレスな移行のために言及されている技術は何ですか？
     A) 物理レプリケーション。
     B) データベーススナップショット。
     C) 論理レプリケーション。
     D) コンテナ化。
     Correct Answer: C
     Explanation: PostgreSQLのアップグレード中にシームレスな移行のために言及されている技術は論理レプリケーションです。
  --- 例の終了 ---
  
  上記の例の形式とスタイルに従って、同僚からの現実的なメールまたはメッセージ（約200〜300語）を作成してください。ソフトウェア製品の問題または更新に関するものです。
  選択肢が4つ、正しい答えが1つ、簡単な説明が含まれる多肢選択式の理解度質問を3つ含めてください。
  重要：各質問の「explanation」は日本語でなければなりません。`;

  try {
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: READING_SCHEMA,
        systemInstruction: "You are a senior technical English tutor designed to simulate real-world software engineering communication."
      }
    });
    logger.info("Successfully generated reading exercise.");
    return JSON.parse(response.text!) as ReadingExercise;
  } catch (error) {
    logger.error("Error generating reading exercise:", error);
    throw error;
  }
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
  const topic = getRandomTopic();
  logger.info(`Generating writing scenario for level: ${level}, topic: ${topic}`);
  const levelContext = getLevelContext(level);
  const prompt = `Generate a writing scenario for a software engineer.
  ${levelContext}
  This time, the situation is about ${topic}.
  The user needs to write a message to an overseas colleague.
  
  Format constraints:
  1. 'context' must be in English (simulate a received message/situation).
  2. 'goal' and 'keyPoints' MUST be in Japanese (instructions to the user).`;

  try {
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: SCENARIO_SCHEMA
      }
    });
    logger.info("Successfully generated writing scenario.");
    return JSON.parse(response.text!) as WritingScenario;
  } catch (error) {
    logger.error("Error generating writing scenario:", error);
    throw error;
  }
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
  logger.info(`Evaluating writing for level: ${level}, scenario context: ${scenario.context}`);
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

  try {
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: FEEDBACK_SCHEMA
      }
    });
    logger.info("Successfully evaluated writing.");
    return JSON.parse(response.text!) as WritingFeedback;
  } catch (error) {
    logger.error("Error evaluating writing:", error);
    throw error;
  }
};