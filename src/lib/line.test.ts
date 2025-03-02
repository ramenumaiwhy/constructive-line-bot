import crypto from "crypto";
import { vi, describe, it, expect, beforeEach } from "vitest";
import { sendTextMessage, validateSignature, lineClient } from "./line";

/**
 * LINE SDKのモック設定
 * @remarks
 * - MessagingApiClientをモック化し、replyMessageメソッドが成功レスポンスを返すように設定
 * - 実際のLINEプラットフォームとの通信をシミュレート
 */
vi.mock("@line/bot-sdk", async () => {
  const actual = await vi.importActual("@line/bot-sdk");
  return {
    ...actual,
    messagingApi: {
      MessagingApiClient: vi.fn().mockImplementation(() => ({
        replyMessage: vi.fn().mockResolvedValue({ status: 200 }),
      })),
    },
  };
});

describe("LINE SDK", () => {
  const replyToken = "test-reply-token";
  const text = "test-message";

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("sendTextMessage", () => {
    /**
     * メッセージ送信の基本機能テスト
     * - 正常系: メッセージが送信され、成功レスポンスが返ることを確認
     * - パラメータ検証: LINE APIに正しいパラメータが渡されることを確認
     */
    it("メッセージを正しく送信できる", async () => {
      const response = await sendTextMessage(replyToken, text);
      expect(response).toEqual({ status: 200 });
    });

    it("正しいパラメータでreplyMessageが呼ばれる", async () => {
      await sendTextMessage(replyToken, text);
      expect(lineClient.replyMessage).toHaveBeenCalledWith({
        replyToken,
        messages: [
          {
            type: "text",
            text,
          },
        ],
      });
    });
  });

  describe("validateSignature", () => {
    const channelSecret = process.env.LINE_CHANNEL_SECRET || "test-secret";
    const body = JSON.stringify({ test: "data" });

    /**
     * 署名検証機能のテスト
     * - 正常系: 有効な署名の場合、trueを返すことを確認
     * - 異常系: 無効な署名やundefinedの場合、falseを返すことを確認
     * @remarks
     * LINE Messaging APIからのWebhookリクエストの正当性を検証する重要な機能
     */
    it("有効な署名の場合はtrueを返す", () => {
      const signature = crypto
        .createHmac("SHA256", channelSecret)
        .update(body)
        .digest("base64");
      expect(validateSignature(body, signature)).toBe(true);
    });

    it("無効な署名の場合はfalseを返す", () => {
      const signature = "invalid-signature";
      expect(validateSignature(body, signature)).toBe(false);
    });

    it("署名がundefinedの場合はfalseを返す", () => {
      expect(validateSignature(body, undefined)).toBe(false);
    });
  });
});
