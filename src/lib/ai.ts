import {
  InvalidToolArgumentsError,
  Message,
  NoSuchToolError,
  ToolExecutionError,
} from "ai";
import { google } from "@ai-sdk/google";
import { generateText, streamText } from "ai";

/**
 * Google AI モデルの設定
 * @remarks
 * - モデル: gemini-2.0-pro-exp-02-05
 * - 安全性設定: 有害なコンテンツをブロックするための設定。現状は指定はなし。
 */
const model = google("gemini-2.0-pro-exp-02-05", {
  safetySettings: [],
});

/**
 * システムプロンプト
 * @remarks
 * AIアシスタントの役割と応答の制約を定義
 * - 専門分野: 栄養学、運動生理学、行動心理学
 * - 応答スタイル: フレンドリーかつ専門的
 * - 安全性: 危険なアドバイスを避け、必要に応じて医療専門家への相談を推奨
 */
const SYSTEM_PROMPT = `
あなたはダイエットコーチのAIアシスタントです。
以下の特徴を持っています：

- 専門知識：栄養学、運動生理学、行動心理学の知識を持ち、科学的根拠に基づいたアドバイスを提供します
- コミュニケーションスタイル：フレンドリーで励ましながらも、必要に応じて厳しいアドバイスもできます
- 目標：ユーザーの健康的で持続可能なダイエットをサポートします

返答の際は以下の点に注意してください：
1. 常に科学的根拠に基づいた情報を提供する
2. ユーザーの状況や感情に共感しながら、建設的なアドバイスを行う
3. 危険なダイエット方法は推奨せず、健康的な方法を提案する
4. 医療アドバイスが必要な場合は、専門家への相談を推奨する
`;

/**
 * AI応答を生成する関数
 * @param userMessage - ユーザーからのメッセージ
 * @param chatHistory - これまでの会話履歴（オプション）
 * @returns 生成されたテキスト応答
 * @throws {Error} AI応答の生成に失敗した場合
 * @example
 * ```ts
 * const response = await generateAIResponse("今日の夕食のアドバイスをください");
 * console.log(response);
 * ```
 */
export async function generateAIResponse(
  userMessage: string,
  chatHistory: Message[] = []
): Promise<string> {
  try {
    const { text } = await generateText({
      model,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        ...chatHistory,
        { role: "user", content: userMessage },
      ],
    });

    return text;
  } catch (error) {
    console.error("AI応答生成エラー:", error);
    return "申し訳ありません。現在応答を生成できません。しばらく経ってからもう一度お試しください。";
  }
}

/**
 * ストリーミング応答を生成する関数
 * @param userMessage - ユーザーからのメッセージ
 * @param chatHistory - これまでの会話履歴（オプション）
 * @returns SSEストリームを含むResponse
 * @throws {Error} ストリーミング応答の生成に失敗した場合
 * @remarks
 * Server-Sent Events (SSE) を使用してリアルタイムに応答を返します
 * @example
 * ```ts
 * const stream = generateAIStream("運動のアドバイスをください");
 * return stream; // SSEストリームとしてクライアントに返却
 * ```
 */
export function generateAIStream(
  userMessage: string,
  chatHistory: Message[] = []
): Response {
  try {
    const result = streamText({
      model,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        ...chatHistory,
        { role: "user", content: userMessage },
      ],
    });

    return result.toDataStreamResponse({
      getErrorMessage: (error: unknown) => {
        console.error("Streaming error details:", error);
        if (NoSuchToolError.isInstance(error)) {
          return "The model tried to call a unknown tool.";
        } else if (InvalidToolArgumentsError.isInstance(error)) {
          return "The model called a tool with invalid arguments.";
        } else if (ToolExecutionError.isInstance(error)) {
          return "An error occurred during tool execution.";
        } else {
          const errorMessage =
            error instanceof Error ? error.message : "Unknown error";
          return `An error occurred: ${errorMessage}`;
        }
      },
    });
  } catch (error) {
    console.error("AI応答生成エラー:", error);
    return new Response(
      "申し訳ありません。現在応答を生成できません。しばらく経ってからもう一度お試しください。",
      { status: 500 }
    );
  }
}
