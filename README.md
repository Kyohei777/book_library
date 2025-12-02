# Home Library App

個人蔵書を管理するためのWebアプリケーションです。バーコードスキャンによる簡単な登録と、シリーズごとに整理された美しい本棚表示が特徴です。

## 📖 概要

このアプリケーションは、物理的な書籍の管理をデジタル化し、視覚的に楽しめる形で提供することを目的としています。PCやスマートフォンのカメラを使用してISBNバーコードをスキャンするだけで、書誌情報を自動的に取得・登録できます。

## ✨ 主な機能

- **ISBNバーコードスキャン**:
  - PCおよびモバイル端末のカメラに対応。
  - 連続スキャンモードで大量の本もスムーズに登録。
- **自動データ取得**:
  - OpenBD、Google Books API、楽天ブックスAPI（要設定）から書誌情報を自動取得。
  - 表紙画像、タイトル、著者、出版社、発売日などを保存。
- **本棚ビュー (Bookshelf View)**:
  - 登録した本を背表紙風に並べて表示。
  - シリーズ（作品）ごとに自動で棚分けされ、整理された状態で閲覧可能。
  - 背表紙の色はシリーズごとに統一され、統一感のある見た目を実現。
- **検索・フィルタリング**:
  - タイトルや著者名でのリアルタイム検索。
  - 読書状態（未読、読書中、読了）でのフィルタリング。
- **レスポンシブデザイン**:
  - PC、タブレット、スマートフォンなど、あらゆるデバイスで快適に動作。
  - ダークモード対応。

## 🛠️ アーキテクチャ

このプロジェクトは、モダンなWeb技術スタックを使用して構築されています。

### フロントエンド (`frontend/`)
- **Framework**: [Next.js 14](https://nextjs.org/) (App Router)
- **Language**: TypeScript
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **Key Components**:
  - `Scanner.tsx`: `react-webcam` と `@zxing/library` を使用したバーコード読み取り。
  - `BookshelfView.tsx`: CSSで本棚と背表紙を表現し、シリーズごとのグルーピングロジックを実装。
  - `GroupSection.tsx`: 著者やシリーズごとの折りたたみ可能なリスト表示。

### バックエンド (`backend/`)
- **Framework**: [FastAPI](https://fastapi.tiangolo.com/) (Python)
- **Database**: SQLite
- **ORM**: [SQLAlchemy](https://www.sqlalchemy.org/)
- **API**: RESTful API設計。

### インフラストラクチャ
- **Docker Compose**: フロントエンドとバックエンドのコンテナオーケストレーション。
- **データ永続化**: `backend/db/library.db` にSQLiteデータベースファイルを保存。

## 🚀 セットアップと起動

### 前提条件
- Docker および Docker Compose がインストールされていること。

### 手順

1. **リポジトリのクローン**
   ```bash
   git clone <repository-url>
   cd book_library
   ```

2. **アプリケーションの起動**
   Docker Composeを使用してビルドと起動を行います。
   ```bash
   docker-compose up --build
   ```

3. **アクセス**
   起動が完了したら、ブラウザで以下のURLにアクセスしてください。
   - **アプリ本体**: [http://localhost:3002](http://localhost:3002)
   - **APIドキュメント**: [http://localhost:8001/docs](http://localhost:8001/docs)

### ⚙️ 環境設定（楽天ブックスAPI）

本アプリは、書誌情報の取得精度を向上させるために楽天ブックスAPIを使用しています。
デフォルトでも動作しますが、ご自身のAPIキー（アプリID）を設定することを推奨します。

1. [Rakuten Developers](https://webservice.rakuten.co.jp/) にアクセスし、会員登録・ログインを行います。
2. 「アプリID発行」から新しいアプリを作成し、**アプリID (App ID)** を取得します。
3. プロジェクトルートにある `.env.example` をコピーして `.env` ファイルを作成します。
   ```bash
   cp .env.example .env
   ```
4. `.env` ファイルを開き、`RAKUTEN_APP_ID` に取得したIDを設定します。

```env
RAKUTEN_APP_ID=あなたのアプリID
```

5. Docker Composeを再起動して設定を反映させます。
   ```bash
   docker-compose down
   docker-compose up -d --build
   ```

## 📱 使い方

### 本の登録
1. 画面右下の「+」ボタンをクリックします。
2. 「バーコードスキャン」を選択するとカメラが起動します。
3. 本の裏表紙にあるISBNバーコード（上段の978から始まるコード）をカメラにかざします。
4. 読み取りが成功すると、自動的に本が登録されます。
5. 手動入力の場合は、ISBNを入力して登録することも可能です。

### 本の閲覧
- **グリッド表示**: 表紙画像を並べて表示します。
- **リスト表示**: 詳細情報をリスト形式で表示します。
- **本棚表示**: 背表紙を並べた本棚スタイルで表示します。
- **著者別・シリーズ別**: 著者やシリーズごとにグループ化して表示します。

### データの管理
- 本をクリックすると詳細モーダルが開き、情報の編集や削除が可能です。
- 読書状態（未読・読了など）を変更して管理できます。

## 📁 ディレクトリ構成

```
book_library/
├── backend/            # FastAPI バックエンド
│   ├── db/             # SQLiteデータベースファイル (git管理外)
│   ├── main.py         # APIエントリーポイント
│   ├── database.py     # DB接続設定
│   ├── models.py       # DBモデル定義
│   └── ...
├── frontend/           # Next.js フロントエンド
│   ├── src/
│   │   ├── app/        # ページコンポーネント
│   │   ├── components/ # UIコンポーネント
│   │   └── ...
│   └── ...
├── certs/              # SSL証明書 (git管理外)
├── docker-compose.yml  # Docker構成ファイル
└── README.md           # プロジェクトドキュメント
```
