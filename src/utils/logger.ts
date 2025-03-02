/**
 * ロギングユーティリティ
 */

/**
 * ログレベルの定義
 */
export enum LogLevel {
  DEBUG = "DEBUG",
  INFO = "INFO",
  WARN = "WARN",
  ERROR = "ERROR",
}

/**
 * アプリケーションロガー
 */
export class Logger {
  /**
   * ロギング情報を出力
   * @param level - ログレベル
   * @param message - ログメッセージ
   * @param data - 追加データ（オプション）
   */
  static log(level: LogLevel, message: string, data?: any): void {
    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      level,
      message,
      ...(data ? { data } : {}),
    };
    
    switch (level) {
      case LogLevel.ERROR:
        console.error(JSON.stringify(logEntry));
        break;
      case LogLevel.WARN:
        console.warn(JSON.stringify(logEntry));
        break;
      case LogLevel.INFO:
        console.info(JSON.stringify(logEntry));
        break;
      case LogLevel.DEBUG:
        console.debug(JSON.stringify(logEntry));
        break;
    }
  }
  
  // ショートカットメソッド
  static debug(message: string, data?: any): void {
    this.log(LogLevel.DEBUG, message, data);
  }
  
  static info(message: string, data?: any): void {
    this.log(LogLevel.INFO, message, data);
  }
  
  static warn(message: string, data?: any): void {
    this.log(LogLevel.WARN, message, data);
  }
  
  static error(message: string, data?: any): void {
    this.log(LogLevel.ERROR, message, data);
  }
} 