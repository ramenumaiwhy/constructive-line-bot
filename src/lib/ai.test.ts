import { vi, describe, it, expect, beforeEach } from "vitest";
import { generateAIResponse, generateAIStream } from "./ai";
import { Message, generateText, streamText } from "ai";

/**
 * Google AI SDKのモック設定
 * @remarks
 * - google関数をモック化し、AIモデルの初期化をシミュレート
 */
vi.mock("@ai-sdk/google", () => ({
  google: vi.fn(),
}));

/**
 * AI SDKの関数モック設定
 * @remarks
 * - generateText: テキスト生成をシミュレート、固定の応答を返す
 * - streamText: ストリーミング応答をシミュレート、SSEレスポンスを返す
 */
vi.mock("ai", () => ({
  generateText: vi.fn().mockResolvedValue({ text: "AIからの応答" }),
  streamText: vi.fn().mockReturnValue({
    toDataStreamResponse: () =>
      new Response("テストストリーム", {
        headers: {
          "Content-Type": "text/event-stream",
        },
      }),
  }),
}));

describe("AI機能", () => {
  const userMessage = "テストメッセージ";
  const mockResponse = "AIからの応答";

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("generateAIResponse", () => {
    /**
     * AI応答生成機能のテスト
     * @remarks
     * - 正常系: AIが適切な応答を生成することを確認
     * - エラー処理: エラー発生時に適切なメッセージを返すことを確認
     * - チャット履歴: 過去の会話を考慮して応答を生成できることを確認
     */
    it("正常にAI応答を生成できる", async () => {
      const response = await generateAIResponse(userMessage);
      expect(response).toBe(mockResponse);
      expect(vi.mocked(generateText)).toHaveBeenCalledTimes(1);
    });

    it("エラー時に適切なエラーメッセージを返す", async () => {
      vi.mocked(generateText).mockRejectedValueOnce(new Error("テストエラー"));
      const response = await generateAIResponse(userMessage);
      expect(response).toBe(
        "申し訳ありません。現在応答を生成できません。しばらく経ってからもう一度お試しください。"
      );
    });

    it("チャット履歴を含めて応答を生成できる", async () => {
      const chatHistory: Message[] = [
        { id: "1", role: "user", content: "過去のメッセージ" },
        { id: "2", role: "assistant", content: "過去の応答" },
      ];
      await generateAIResponse(userMessage, chatHistory);
      expect(vi.mocked(generateText)).toHaveBeenCalledWith(
        expect.objectContaining({
          messages: expect.arrayContaining([
            expect.objectContaining({ role: "system" }),
            ...chatHistory,
            { role: "user", content: userMessage },
          ]),
        })
      );
    });
  });

  describe("generateAIStream", () => {
    /**
     * AIストリーミング応答生成機能のテスト
     * @remarks
     * - 正常系: ストリーミングレスポンスが適切に生成されることを確認
     * - エラー処理: エラー発生時に500エラーレスポンスを返すことを確認
     * - チャット履歴: 過去の会話を考慮してストリームを生成できることを確認
     */
    it("正常にストリームレスポンスを生成できる", () => {
      const response = generateAIStream(userMessage);
      expect(response).toBeInstanceOf(Response);
      expect(vi.mocked(streamText)).toHaveBeenCalledTimes(1);
    });

    it("エラー時に500エラーレスポンスを返す", () => {
      vi.mocked(streamText).mockImplementationOnce(() => {
        throw new Error("ストリームエラー");
      });
      const response = generateAIStream(userMessage);
      expect(response.status).toBe(500);
    });

    it("チャット履歴を含めてストリームを生成できる", () => {
      const chatHistory: Message[] = [
        { id: "1", role: "user", content: "過去のメッセージ" },
        { id: "2", role: "assistant", content: "過去の応答" },
      ];
      generateAIStream(userMessage, chatHistory);
      expect(vi.mocked(streamText)).toHaveBeenCalledWith(
        expect.objectContaining({
          messages: expect.arrayContaining([
            expect.objectContaining({ role: "system" }),
            ...chatHistory,
            { role: "user", content: userMessage },
          ]),
        })
      );
    });
  });
});
