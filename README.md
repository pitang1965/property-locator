# 物件位置推定マップ

不動産物件の広告に記載された「周辺施設までの徒歩距離」から、物件の実際の位置を地図上で推定するツールです。

## デモ

https://pitang1965.github.io/property-locator/

## 機能

- 複数の周辺施設（学校、駅、店舗など）を登録
- 各施設の位置をGoogle Mapsから取得して設定
- 徒歩距離から直線距離への換算（係数調整可能）
- 円の重なりから物件の推定位置を表示
- データのローカル保存（localStorage）

## 使い方

1. 物件広告に記載された周辺施設を入力（例：「○○小学校」「△△駅」）
2. 各施設の位置を設定
   - 📍ボタン：地図をクリックして設定
   - 📋ボタン：Google MapsのURLまたは座標を貼り付け
3. 徒歩距離（メートル）を入力
4. 「位置を推定」ボタンをクリック
5. 円が重なる部分が物件の推定位置

## 技術スタック

- HTML / CSS / JavaScript（バニラJS）
- [Leaflet.js](https://leafletjs.com/) - 地図ライブラリ
- [OpenStreetMap](https://www.openstreetmap.org/) - 地図タイル

## ローカルで実行

```bash
# リポジトリをクローン
git clone https://github.com/pitang1965/property-locator.git
cd property-locator

# 任意のHTTPサーバーで起動（例）
npx serve .
# または
python -m http.server 8000
```

ブラウザで `http://localhost:8000` にアクセス

## ファイル構成

```
property-locator/
├── index.html      # メインHTML
├── app.js          # アプリケーションロジック
├── style.css       # スタイルシート
├── privacy.html    # プライバシーポリシー
├── sitemap.xml     # サイトマップ
├── favicon.ico     # ファビコン
└── ogp.png         # OGP画像
```

## ライセンス

MIT License

## クレジット

- 地図データ: © [OpenStreetMap](https://www.openstreetmap.org/copyright) contributors
