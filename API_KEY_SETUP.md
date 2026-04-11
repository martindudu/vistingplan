# 🔑 Google Maps API Key 設定指南

## 📋 設定步驟

### 1. 建立 API Key

1. 前往 [Google Cloud Console](https://console.cloud.google.com/)
2. 選擇或建立專案
3. 前往「API 和服務」→「憑證」
4. 點擊「建立憑證」→「API 金鑰」

### 2. 啟用必要的 API

在「API 和服務」→「程式庫」中啟用以下 API：

- ✅ **Maps JavaScript API**
- ✅ **Geocoding API**
- ✅ **Directions API**

### 3. 設定 API Key 限制（重要！）

點擊剛建立的 API Key 進行編輯：

#### 🔒 應用程式限制

選擇「**HTTP referrers (網站)**」，然後加入以下網址：

```
http://localhost:3000/*
https://vistingplan2026.zeabur.app/*
```

**格式說明：**
- `http://localhost:3000/*` - 本地開發環境
- `https://vistingplan2026.zeabur.app/*` - Zeabur 部署環境
- 結尾的 `/*` 表示允許該網域下的所有路徑

#### 🛡️ API 限制

選擇「**限制金鑰**」，只勾選以下 API：

- ✅ Maps JavaScript API
- ✅ Geocoding API
- ✅ Directions API

**為什麼要限制？**
- 防止 API Key 被濫用
- 降低不必要的費用
- 提高安全性

### 4. 儲存設定

點擊「儲存」完成設定。

## 🚨 安全提醒

1. **不要將 API Key 提交到公開的 Git 倉庫**
   - 使用 `.env.local` 檔案（已加入 `.gitignore`）
   - 在 Zeabur 使用環境變數設定

2. **定期檢查 API 使用量**
   - 在 Google Cloud Console 監控使用情況
   - 設定預算提醒避免超支

3. **如果 API Key 外洩**
   - 立即在 Google Cloud Console 刪除或停用該 Key
   - 建立新的 API Key 並更新環境變數

## 📝 環境變數設定

### 本地開發

建立 `.env.local` 檔案：

```env
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=你的_API_Key
```

### Zeabur 部署

在 Zeabur 專案設定中新增環境變數：

- **變數名稱**：`NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`
- **變數值**：你的 API Key

## ✅ 驗證設定

設定完成後，訪問以下網址確認地圖正常顯示：

- 本地：http://localhost:3000
- Zeabur：https://vistingplan2026.zeabur.app

如果地圖無法顯示，請檢查：

1. API Key 是否正確設定
2. HTTP referrer 限制是否包含正確的網域
3. 必要的 API 是否已啟用
4. 瀏覽器主控台是否有錯誤訊息
