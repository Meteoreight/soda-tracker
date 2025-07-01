# SodaStream 消費量トラッカー

SodaStream炭酸水の消費量、CO2使用量、コスト分析を総合的に管理するアプリケーションです。

*[English README](README.md)*

## 機能

- **日次消費量記録**: 炭酸水の日次消費量を記録し、自動で容量計算
- **CO2シリンダー管理**: 複数のCO2シリンダーをコスト管理と使用期間と共に追跡
- **コスト分析**: 市販炭酸水価格との比較分析
- **分析・可視化**: インタラクティブなグラフで消費トレンドを表示
- **データインポート/エクスポート**: CSV形式でのデータ管理機能
- **レスポンシブデザイン**: 全デバイス対応の白背景クリーンデザイン

## アーキテクチャ

本アプリケーションは3層アーキテクチャを採用しています：

- **フロントエンド**: React 18アプリケーション（5つのメインビュー: ダッシュボード、履歴、分析、シリンダー、設定）
  - UIライブラリ: グラフ用Recharts、日付選択用React DatePicker
  - ルーティング: React Router DOM v6
  - HTTPクライアント: Axios
- **バックエンド**: 包括的なREST APIエンドポイントを持つFastAPI
  - データベースORM: SQLAlchemy 2.0
  - バリデーション: Pydantic v2
  - データ処理: Pandas
- **データベース**: 信頼性の高いデータ永続化のためのPostgreSQL 15

## クイックスタート

### 前提条件

- Docker および Docker Compose
- Git

### インストール

1. プロジェクトディレクトリにクローンまたは移動:
```bash
cd Soda-Tracker
```

2. Docker Composeを使用してアプリケーションを起動:
```bash
docker-compose up --build
```

3. 全サービスの起動完了まで待機（初回実行時は数分かかる場合があります）

4. アプリケーションにアクセス:
   - **フロントエンド**: http://localhost:3003
   - **バックエンドAPI**: http://localhost:8000
   - **APIドキュメント**: http://localhost:8000/docs

### 初期設定

1. **シリンダーセクションに移動**して最初のCO2シリンダーを追加
2. **アクティブに設定**して新しい消費ログで使用
3. **ダッシュボードに移動**して日次消費量の記録を開始
4. **設定を訪問**して市販品価格基準と初期コストを設定

## 使用ガイド

### ダッシュボードビュー
- 日次消費量の**クイック記録**
- 今日の消費量、月間コスト、節約額を表示する**サマリーカード**
- 最近の消費トレンドの**クイックプレビュー**

### 履歴ビュー
- ソート可能なテーブルで**全消費ログを表示**
- 個別の消費記録の**追加、編集、削除**
- フィルタリングオプション付きの**一括データ管理**

### 分析ビュー
- 30日、90日、180日、365日期間での消費トレンドを表示する**インタラクティブグラフ**
- SodaStream使用量と市販品価格の**コスト比較**
- 日次平均値と総消費量を含む**統計サマリー**

### シリンダービュー
- 独自の番号システムでの**CO2シリンダー管理**
- 各シリンダーの**コストと使用期間を追跡**
- CO2ボンベ交換時の**アクティブシリンダー切り替え**

### 設定ビュー
- CSVファイルでの**データインポート/エクスポート**
- コスト比較用の**市販品価格基準を設定**
- SodaStreamデバイスの**初期コストを設定**
- インポート参考用の**サンプルCSVをダウンロード**

## データモデル

### 消費ログ
- 日付、ボトルサイズ（1L/0.5L）、ボトル数
- 容量の自動計算（1L = 840mL、0.5L = 455mL）
- CO2プッシュ数の自動計算（1L = 4プッシュ、0.5L = 2プッシュ）

### CO2シリンダー
- 独自の番号システム（#1、#2など）
- シリンダーごとのコスト追跡
- アクティブ/非アクティブステータス管理

### コスト計算
- 水量ではなくCO2消費量（プッシュ数）ベース
- コスト計算でシリンダーあたり約150プッシュを想定
- 市販品価格と比較（デフォルト: 500mLあたり¥45）

## 開発

### プロジェクト構造
```
Soda-Tracker/
├── docker-compose.yml
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── views/
│   │   └── services/
│   └── package.json
├── backend/
│   ├── app/
│   │   ├── routers/
│   │   ├── models.py
│   │   └── main.py
│   └── requirements.txt
└── README.md
```

### APIエンドポイント

#### 消費ログ
- `GET /api/logs` - 全消費ログを取得
- `POST /api/logs` - 新しい消費ログを作成
- `PUT /api/logs/{id}` - 消費ログを更新
- `DELETE /api/logs/{id}` - 消費ログを削除

#### シリンダー
- `GET /api/cylinders` - 全シリンダーを取得
- `POST /api/cylinders` - 新しいシリンダーを作成
- `PUT /api/cylinders/{id}` - シリンダーを更新
- `POST /api/cylinders/change-active` - アクティブシリンダーを変更

#### 分析
- `GET /api/analytics?period=30d` - 期間の分析データを取得
- `GET /api/analytics/dashboard` - ダッシュボードサマリーを取得

#### 設定
- `GET/PUT /api/settings/retail-price/current` - 市販品価格設定
- `GET/PUT /api/settings/initial-cost/current` - 初期コスト設定

#### データ管理
- `POST /api/data/import` - CSVデータをインポート
- `GET /api/data/export` - CSVデータをエクスポート
- `GET /api/data/sample-csv` - サンプルCSVをダウンロード

### 開発コマンド

```bash
# 開発環境を起動
docker-compose up --build

# ログを表示
docker-compose logs -f

# サービスを停止
docker-compose down

# 特定のサービスを再ビルド
docker-compose build frontend
docker-compose build backend

# データベースにアクセス（必要な場合）
docker-compose exec db psql -U postgres -d soda_tracker
```

## トラブルシューティング

### よくある問題

1. **ポート競合**: ポート3003、8000、5432が利用可能であることを確認
2. **データベース接続**: PostgreSQLのヘルスチェックが通るまで待機
3. **フロントエンドが読み込まれない**: バックエンドが完全に起動してから確認
4. **CSVインポートエラー**: サンプルCSV形式を参考にして使用

### データバックアップ

設定 → CSVにエクスポート機能を使用して定期的にデータをエクスポートしてください。

### データベースリセット

全データをリセットする場合:
```bash
docker-compose down -v
docker-compose up --build
```