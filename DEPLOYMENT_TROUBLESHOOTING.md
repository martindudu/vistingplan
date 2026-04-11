# 🔧 部署問題排查指南 (Vercel 版)

## 常見錯誤解決方案

### 1. 頁面顯示 "google is not defined" (構建失敗)
**原因**：Next.js 在伺服器端預渲染時，Google Maps SDK 尚未載入。
**解決方案**：
- 系統已在代碼中加入 `typeof google !== 'undefined'` 檢查。
- 請確保使用最新的 `app/page.tsx`。
- 如果是本地開發遇到，請確認 `.env.local` 已正確讀取。

### 2. 地圖無法顯示或搜尋無效
**檢查步驟**：
- 前往 **Google Cloud Console** 確認以下 API 已啟用：
  - Maps JavaScript API
  - Places API
  - Directions API
- 檢查 **API Key 限制**：是否已加入您的 Vercel 網域（如 `https://vistingplan.vercel.app/*`）。
- 檢查 Vercel Dashboard 的 **Environment Variables** 是否拼字正確。

### 3. Vercel 部署被 Blocked (Hobby 方案限制)
**錯誤訊息**：`The Hobby Plan does not support collaboration for private repositories.`
**解決方案**：
- 將 GitHub 倉庫設為 **Public (公開)**。
- 或是確保 Git 的作者 Email 與您的 Vercel 帳號 Email 完全一致。

### 4. 圖片無法匯出或海報下載失敗
**解決方案**：
- 本系統使用 `html2canvas` 進行截圖。
- 由於跨網域圖片限制 (CORS)，如果景點照片無法顯示在海報中，請確認 Google Cloud 的 API 金鑰權限是否允許當前網域存取媒體資源。

## ✅ 正常運行的標誌
- ✅ 背景顯示沉浸式風景圖。
- ✅ 搜尋景點時會出現自動完成建議。
- ✅ 景點卡片顯示氣溫與天氣圖示。
- ✅ 點擊眼睛圖示可顯示 360 度街景。

## 📝 部署檢查清單
- [ ] Vercel 環境變數已設定 `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`。
- [ ] Google Cloud 已啟用 **Places API** (非常重要！)。
- [ ] GitHub 倉庫已推送最新代碼。
- [ ] 地圖已設定正確的網站存取限制。
