# 🔧 部署問題排查指南

## 502 錯誤解決方案

如果看到 `/favicon.ico` 或其他資源返回 502 錯誤，請檢查以下項目：

### 1. 檢查環境變數

確保在 Zeabur 中已設定以下環境變數：

```
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=你的_API_Key
```

**檢查步驟：**
- 登入 Zeabur
- 進入你的專案
- 點擊「Environment Variables」
- 確認 `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` 已設定

### 2. 檢查構建日誌

在 Zeabur 中查看構建日誌，確認：
- ✅ 構建成功完成
- ✅ 沒有 TypeScript 錯誤
- ✅ 所有依賴都正確安裝

**檢查步驟：**
- 在 Zeabur 專案頁面
- 點擊「Deployments」
- 查看最新的部署日誌

### 3. 檢查 API Key 限制

確保 Google Maps API Key 已正確設定限制：

**HTTP referrers 限制應包含：**
```
http://localhost:3000/*
https://vistingplan2026.zeabur.app/*
```

**API 限制應只啟用：**
- Maps JavaScript API
- Geocoding API
- Directions API

### 4. 常見錯誤訊息

#### "Cannot find module '@dnd-kit/core'"
**解決方案：** 確保 `package.json` 中包含所有必要的依賴

#### "NEXT_PUBLIC_GOOGLE_MAPS_API_KEY is not defined"
**解決方案：** 在 Zeabur 環境變數中設定 API Key

#### "Property 'name' does not exist on type 'GeocoderResult'"
**解決方案：** 已修正，確保使用最新版本的代碼

### 5. 重新部署

如果問題持續存在：

1. **清除構建快取**
   - 在 Zeabur 專案設定中
   - 找到「Clear Build Cache」選項
   - 清除後重新部署

2. **檢查 Node.js 版本**
   - Zeabur 通常會自動偵測
   - 如果需要，可在 `package.json` 中指定：
     ```json
     "engines": {
       "node": ">=18.0.0"
     }
     ```

### 6. 本地測試

在推送到 GitHub 之前，先在本地測試：

```bash
# 安裝依賴
npm install

# 建立 .env.local 檔案
echo "NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=你的_API_Key" > .env.local

# 測試構建
npm run build

# 啟動生產模式
npm start
```

如果本地構建成功，但 Zeabur 部署失敗，可能是環境變數或構建配置問題。

### 7. 檢查瀏覽器主控台

502 錯誤可能伴隨其他錯誤：

- **API Key 相關錯誤**：檢查 API Key 是否正確設定
- **CORS 錯誤**：檢查 HTTP referrer 限制
- **模組載入錯誤**：檢查構建是否成功

### 8. 聯繫支援

如果以上步驟都無法解決問題：

1. 檢查 Zeabur 的狀態頁面
2. 查看 Zeabur 的官方文件
3. 聯繫 Zeabur 支援團隊

## ✅ 正常運行的標誌

應用程式正常運行時，你應該看到：

- ✅ 沒有 502 錯誤
- ✅ 地圖正常顯示
- ✅ 可以搜尋景點
- ✅ 可以加入行程
- ✅ 可以拖曳排序

## 📝 檢查清單

部署前確認：

- [ ] `package.json` 包含所有依賴
- [ ] 環境變數已設定
- [ ] API Key 限制已正確設定
- [ ] 本地構建成功
- [ ] 代碼已推送到 GitHub
- [ ] Zeabur 部署狀態為「成功」
