#!/bin/bash

# Bunがインストールされているか確認
if ! command -v bun &> /dev/null
then
    echo "Bunをインストールします..."
    npm install -g bun
fi

# 依存関係のインストール
echo "依存関係をインストールします..."
bun install

# アプリケーションのビルド
echo "アプリケーションをビルドします..."
bun build ./src/index.ts --outdir ./dist 