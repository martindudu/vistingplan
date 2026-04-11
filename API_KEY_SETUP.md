# 🔑 Google Maps API Key 設定指南

## 📋 設定步驟

### 1. 建立 API Key
1. 前往 [Google Cloud Console](https://console.cloud.google.com/)
2. 選擇或建立專案
3. 前往「API 和服務」→「憑證」
4. 點擊「建立憑證」→「API 金鑰」

### 2. 啟用必要的 API (核心步驟！)
為了支援本系統的進階功能，請務必在「程式庫」中啟用以下 **5 個** API：
- ✅ **Maps JavaScript API** (地圖顯示)
- ✅ **Places API** (搜尋、景點照片、評分、營業時間、周邊探索)
- ✅ **Directions API** (路徑規劃、智慧排序)
- ✅ **Distance Matrix API** (計算景點間精確行車時間)
- ✅ **Geocoding API** (地址轉換座標)

### 3. 設定 API Key 限制 (極重要！)
為了防止您的額度被盜用，請務必設定限制：

#### 🔒 應用程式限制
選擇「**HTTP 參照位址 (網站)**」，加入以下網址：
```
http://localhost:3000/*
https://vistingplan.vercel.app/*
```
*(請將 vercel.app 網址替換為您實際的部署網域)*

#### 🛡️ API 限制
建議選擇「限制金鑰」，並勾選上述啟用的 5 個 API。

## 📝 環境變數設定

### 本地開發 (.env.local)
```env
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=您的_API_Key
```

### Vercel 部署
1. 前往 Vercel Dashboard -> 您的專案 -> Settings -> **Environment Variables**
2. 新增 `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` 並填入您的 Key。
3. 重新部署專案以生效。

## ✅ 驗證功能
- **氣溫顯示**：若景點旁沒出現溫度，請檢查網路連線。
- **搜尋無結果**：請確認 **Places API** 已正確啟動。
