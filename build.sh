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

# ビルド結果の確認
echo "ビルド結果を確認します..."
ls -la ./dist

# ビルド後のファイルをコピー
echo "ビルド後のファイルをコピーします..."
cp -r ./dist/* ./

# ファイル構造の確認
echo "ファイル構造を確認します..."
ls -la ./ 