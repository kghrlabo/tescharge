# Charge Monitor

Tesla Fleet APIを利用して充電セッションを自動記録し、SOC・充電速度・電流・電圧などを多角的に分析するための個人利用Webアプリ（Next.js App Router / Vercel）。

計測開始を押すだけで、ケーブル接続〜充電完了までのデータを30秒（or 60秒）間隔で自動収集し、セッション履歴・7種のグラフ（特にSOC対充電速度カーブ）で分析できます。

## アーキテクチャ概要

- **フロントエンド/バックエンド**: Next.js (App Router, TypeScript)。Route HandlerがTesla Fleet APIへのプロキシを担う。
- **認証**: Tesla OAuth2。トークンは暗号化されたhttpOnly Cookie（`iron-session`）にサーバー側のみで保持（DB不要）。
- **データ収集**: ブラウザ主導ポーリング。`/measure` 画面（実際にはルートレイアウトの `ChargeSessionProvider`）が計測中、一定間隔で `/api/vehicle/charge-status` を叩き、車両データを取得する。**計測中はブラウザのタブを閉じないこと**が前提。
- **保存**: ブラウザ内IndexedDB（`Dexie.js`）。`lib/db/repositories/` のインターフェース越しにのみアクセスするため、将来Supabase/Postgres実装へ差し替え可能。
- **グラフ**: Recharts。

詳細設計は元の実装プラン（`tesla-fleet-api-web-polymorphic-waffle.md`）を参照。

## セットアップ

### 1. 依存関係のインストール

```bash
npm install
```

### 2. ローカル開発（フェイクTesla APIモード・推奨）

実際のTesla Developerアカウントがなくても、シミュレータで全フローを確認できます。

```bash
cp .env.example .env.local
# .env.local の USE_FAKE_TESLA_API=true を確認（デフォルトでtrue）
npm run dev
```

`http://localhost:3000` を開き、「Teslaアカウントと連携」→ 設定画面のシナリオ選択（自宅AC充電・急速DC充電・スリープ車両からの起床・401/429エラーなど）で好きな挙動を選べます。フェイクモードは実時間を60倍速に圧縮しているため、実際のセッションは数分で完了します。

### 3. 本番向け：Tesla Developerアカウントのセットアップ

Fleet APIを実際のTesla車両に対して使うには、以下の手順が必要です（**まだ未実施**）。

1. [developer.tesla.com](https://developer.tesla.com) でDeveloperアカウントを作成し、アプリを登録して **Client ID / Client Secret** を取得する。
2. `keys/` にすでに生成済みのEC鍵ペア（`private-key.pem` / `public-key.pem`, secp256r1）がある。`public/.well-known/appspecific/com.tesla.3p.public-key.pem` に公開鍵がすでに配置済み（`.gitignore` で個別に追跡対象としている）。
   - 独自のドメインで使う場合は、同じ手順で鍵を作り直しても良い：
     ```bash
     openssl ecparam -name prime256v1 -genkey -noout -out keys/private-key.pem
     openssl ec -in keys/private-key.pem -pubout -out keys/public-key.pem
     cp keys/public-key.pem public/.well-known/appspecific/com.tesla.3p.public-key.pem
     ```
3. Vercelにデプロイし、割り当てられた公開HTTPSドメインを確認する。
4. `https://<デプロイ先ドメイン>/.well-known/appspecific/com.tesla.3p.public-key.pem` が `Content-Type: text/plain` で正しく取得できることを確認する。
5. Tesla Developerダッシュボードの allowed_origins / redirect URI に、そのドメインを登録する。
6. パートナーアカウント登録エンドポイント `POST /api/1/partner_accounts` を呼び出し（パートナー認証トークンが必要）、`GET /api/1/partner_accounts/public_key?domain=...` で登録が反映されていることを確認する。
7. Vercelの環境変数に以下を設定する（`USE_FAKE_TESLA_API` は必ず未設定 or `false`）:
   - `TESLA_CLIENT_ID`
   - `TESLA_CLIENT_SECRET`
   - `TESLA_REDIRECT_URI`（例: `https://<ドメイン>/api/auth/callback`）
   - `IRON_SESSION_PASSWORD`（32文字以上のランダム文字列）

> **注意**: `lib/tesla/client.ts` 内のリージョン解決（NA/EU判定）とトークン交換時の `audience` パラメータの扱いは、実装時点でTesla公式ドキュメントへの自動アクセスができなかったため、既知の実装パターンから最善の推測で実装しています。実際のDeveloperアカウントでの接続時にエラーが出た場合は、まずこの2箇所（`exchangeCodeForToken` / `resolveFleetApiBaseUrl`）を公式ドキュメントと突き合わせて調整してください。

### 4. ビルド

```bash
npm run build
```

## 既知のV1制約

- **ブラウザを閉じると計測が止まる**: サーバーレス関数は長時間ポーリングに向かないため、計測中はブラウザ（タブ）を開いたままにする必要がある設計。
- **保存先はブラウザ内IndexedDBのみ**: 端末/ブラウザをまたいだ同期はできない。将来Supabase移行を想定してリポジトリ層を抽象化済み。
- **プレコンディショニング**: Tesla APIに信頼できるフィールドが無いため、計測開始前の手動トグル入力。
- **場所判定**: 自宅は設定した緯度経度＋半径、それ以外はユーザー登録の充電器マスタとの近傍マッチ（200m以内）。どちらにも該当しなければ「その他」。

## 今後の拡張（未実装）

複数セッションのグラフ重ね表示、SOC別平均充電速度テーブル、充電器出力比較、CSVエクスポート、月間レポート、Supabase/Postgres移行。
