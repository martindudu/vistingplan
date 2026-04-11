# 🗺️ 旅遊規劃器

一個使用 Google Maps API 建立的旅遊行程規劃工具，支援景點搜尋、地圖顯示、行程管理和行車時間計算。

## ✨ 功能特色

- 🔍 **景點搜尋**：輸入景點名稱或地址即可搜尋
- 🗺️ **地圖顯示**：即時顯示景點位置
- 📋 **行程管理**：輕鬆新增、刪除景點
- 🔄 **拖曳排序**：自由調整行程順序
- ⏱️ **行車時間**：自動計算景點間的行車時間
- 🔗 **Google Maps 連結**：點擊地址直接開啟 Google Maps

## 🚀 快速開始

### 本地開發

1. **安裝依賴**
```bash
npm install
```

2. **設定環境變數**

建立 `.env.local` 檔案：
```
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_google_maps_api_key
```

3. **取得 Google Maps API Key**

- 前往 [Google Cloud Console](https://console.cloud.google.com/)
- 建立新專案或選擇現有專案
- 啟用以下 API：
  - Maps JavaScript API
  - Geocoding API
  - Directions API
- 建立 API Key 並設定應用程式限制（建議設定 HTTP referrer 限制）

**API Key 限制設定（重要！）：**

在 Google Cloud Console 的「憑證」頁面，編輯你的 API Key：

**應用程式限制** → 選擇「HTTP referrers (網站)」，加入：
- `http://localhost:3000/*` (本地開發)
- `https://vistingplan2026.zeabur.app/*` (Zeabur 部署)

**API 限制** → 選擇「限制金鑰」，只啟用：
- Maps JavaScript API
- Geocoding API
- Directions API

4. **啟動開發伺服器**
```bash
npm run dev
```

5. **開啟瀏覽器**
訪問 [http://localhost:3000](http://localhost:3000)

## 📦 部署到 Zeabur

### 使用 GitHub 部署

1. **將專案推送到 GitHub**
```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin your-github-repo-url
git push -u origin main
```

2. **在 Zeabur 部署**

- 登入 [Zeabur](https://zeabur.com/)
- 點擊 "New Project"
- 選擇 "Import from GitHub"
- 選擇你的專案倉庫
- Zeabur 會自動偵測 Next.js 專案

3. **設定環境變數**

在 Zeabur 專案設定中，新增環境變數：
```
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_google_maps_api_key
```

**重要提醒：**
- 確保你的 API Key 在 Google Cloud Console 中已設定 HTTP referrer 限制
- 必須包含你的 Zeabur 網域：`https://vistingplan2026.zeabur.app/*`

4. **部署**

Zeabur 會自動建置並部署你的應用程式。

### 使用 Zeabur CLI 部署

```bash
# 安裝 Zeabur CLI
npm install -g @zeabur/cli

# 登入
zeabur login

# 部署
zeabur deploy
```

## 🛠️ 技術棧

- **Next.js 14** - React 框架
- **TypeScript** - 型別安全
- **Google Maps API** - 地圖和地點服務
- **React Beautiful DnD** - 拖曳排序功能

## 📝 使用說明

1. **搜尋景點**：在搜尋框輸入景點名稱或地址，點擊「搜尋景點」按鈕
2. **查看地圖**：搜尋後會在地圖上顯示景點位置
3. **加入行程**：點擊「加入行程」按鈕將景點加入行程
4. **調整順序**：在行程區塊中，拖曳景點項目即可調整順序
5. **查看路線**：當行程中有多個景點時，地圖會自動顯示行車路線
6. **查看行車時間**：每個景點下方會顯示前往下一站的行車時間
7. **開啟 Google Maps**：點擊地址連結可在新分頁開啟 Google Maps

## 🔒 安全注意事項

- 請勿將 API Key 提交到公開的 Git 倉庫
- 建議在 Google Cloud Console 中設定 API Key 的使用限制
- 使用環境變數管理敏感資訊

## 📄 授權

MIT License
