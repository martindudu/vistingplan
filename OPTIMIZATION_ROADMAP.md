# 旅遊規劃器分階段優化 Roadmap

本文件整理目前系統可優化方向，依照「使用者價值、開發成本、產品完整度」分成多個階段。建議先完成基礎穩定性，再逐步加入智慧規劃與協作功能。

## 目前系統基礎

目前專案已具備下列能力：

- Google Maps 地圖顯示與地點搜尋
- 景點加入每日行程
- 多天行程分頁
- 拖曳排序景點
- 路線計算與交通模式切換
- 智慧排序路線
- 周邊景點、美食、住宿探索
- 景點天氣顯示
- 街景預覽
- 分享連結
- 海報圖片匯出
- PWA manifest 基礎設定

目前主要限制：

- 行程尚未真正自動儲存在 localStorage
- 大部分功能集中在單一 `app/page.tsx`，後續維護成本會上升
- API 錯誤、載入狀態、空狀態提示仍不足
- 手機版可用，但尚未達到 App 級操作體驗
- 缺少預算、營業時間衝突、AI 自動規劃、匯出格式等進階能力

## Phase 1：基礎穩定與資料保存（已完成）

目標：讓使用者可以放心規劃，不怕重新整理或 API 異常造成體驗中斷。

### 建議功能

- 自動儲存行程到 localStorage
- 開啟頁面時自動復原上次行程
- 新增「清空全部行程」功能
- 新增 API key 未設定提示
- 新增 Google Maps / Weather / Directions API 錯誤提示
- 將 `alert()` 改為 toast 或頁面內提示
- 分享連結複製成功/失敗提示
- 海報匯出失敗提示

### 技術調整

- 建立 `utils/storage.ts`
- 建立 `utils/share.ts`
- 建立簡易 toast 狀態或 `components/Toast.tsx`
- 將分享連結編碼/解碼邏輯從頁面中抽出

### 驗收標準

- 重新整理頁面後，行程仍存在
- API key 缺失時，畫面有明確提示
- 分享、匯出、路線失敗時，使用者知道發生什麼事
- 不再依賴瀏覽器原生 `alert()`

### 完成紀錄

- 已加入 localStorage 自動儲存與啟動時復原
- 已加入分享連結載入成功/失敗提示
- 已加入 Google Maps API Key 未設定提示
- 已加入路線、周邊探索、天氣與海報匯出的錯誤提示
- 已將分享成功提示由 `alert()` 改為 toast
- 已加入清空全部行程功能
- 已補上 toast 與 API warning 樣式
- 尚未完成建置驗證，因目前 shell 找不到 `node` / `npm`

## Phase 2：行程編輯體驗強化（核心功能已完成）

目標：讓多日旅遊規劃更完整，支援實際旅行安排中的常見操作。

### 建議功能

- Day 重新命名（本階段實作）
- Day 刪除（本階段實作）
- Day 複製（本階段實作）
- 景點移動到其他天（本階段實作）
- 景點複製到其他天（本階段實作）
- 每日備註
- 行程總覽模式
- 每日景點數、總交通時間、總停留時間統計
- 手動新增自訂地點
- 支援無地址的備忘項目，例如「集合」、「休息」、「購物時間」

### 技術調整

- 建立 `hooks/useItinerary.ts`
- 建立 `components/DayTabs.tsx`
- 建立 `components/ItineraryItem.tsx`
- 建立 `components/ItinerarySummary.tsx`
- 重新整理 `DayPlan` 與 `ItineraryItem` 型別

### 驗收標準

- 使用者可以完整管理多天行程
- 不需要刪除重建即可調整 Day
- 可加入非 Google 地點的行程項目
- 每日行程資訊更容易掃描

### 完成紀錄

- 已加入新增 Day 功能
- 已加入目前 Day 直接重新命名
- 已加入複製目前 Day
- 已加入刪除目前 Day；僅剩一個 Day 時改為清空目前 Day
- 已加入景點移動到其他天
- 已加入景點複製到其他天
- 已補上 Day 編輯列與景點跨日操作樣式

### 尚未完成項目

- 每日備註
- 行程總覽模式
- 每日景點數、總交通時間、總停留時間統計
- 手動新增自訂地點
- 支援無地址的備忘項目

## Phase 3：時間軸與行程合理性

目標：讓系統不只是記錄景點，而是能幫使用者判斷行程是否合理。

### 建議功能

- 營業時間顯示
- 營業時間衝突提醒
- 行程太趕提醒
- 每日結束時間預估
- 午餐/晚餐時段提醒
- 自動插入用餐時間
- 停留時間快速自訂
- 支援不同日期的天氣預報
- 顯示交通時間累計

### 技術調整

- 建立 `utils/time.ts`
- 建立 `utils/validation.ts`
- 在 `ItineraryItem` 補上 opening hours 與 warning 狀態
- 將 schedule 計算抽成 pure function，方便測試

### 驗收標準

- 系統能提示「此景點抵達時可能已關門」
- 系統能提示「今日行程可能太緊」
- 使用者可清楚看到每日出發與結束時間
- 時間計算邏輯可以被獨立測試

## Phase 4：手機版與 PWA 體驗

目標：讓使用者在旅途中也能順暢使用，而不只是桌面規劃工具。

### 建議功能

- 手機版「行程 / 地圖」分頁
- 底部固定主要操作列
- 一鍵開啟目前行程導航
- 景點卡片手機版壓縮資訊
- 離線檢視已保存行程
- PWA 安裝提示
- 加入 service worker 快取基礎頁面與靜態資源

### 技術調整

- 調整 responsive layout
- 建立 `components/MobileShell.tsx`
- 補上 service worker 或導入 Next.js PWA 方案
- 檢查地圖在手機 viewport 的互動與高度

### 驗收標準

- 手機使用時不需要頻繁上下滑動找功能
- 地圖與行程可以快速切換
- 已保存行程在網路不穩時仍可查看
- PWA 可正常安裝到手機桌面

## Phase 5：匯出與分享升級

目標：讓行程可以更容易交給旅伴、列印、存檔或放進其他工具。

### 建議功能

- PDF 匯出
- CSV / Excel 匯出
- Google Calendar / iCal 匯出
- 文字版行程摘要
- LINE 分享格式
- 可選擇匯出單日或全部天數
- 海報模板選擇
- 分享連結壓縮，避免網址過長

### 技術調整

- 建立 `utils/export.ts`
- 建立 `components/ExportDialog.tsx`
- 考慮使用短連結後端或雲端儲存方案
- 分離 poster render component

### 驗收標準

- 使用者可匯出 PDF/文字/圖片至少三種格式
- 分享內容可被旅伴直接理解
- 多日行程可以一次完整匯出
- 長行程分享連結不會過長或失敗

## Phase 6：預算與旅行資訊管理

目標：將系統從「路線規劃器」升級為「完整旅行規劃器」。

### 建議功能

- 每個景點加入預估費用
- 餐費、交通、住宿、門票分類
- 每日預算統計
- 全旅程預算統計
- 幣別設定
- 付款狀態
- 訂房資訊
- 航班資訊
- 票券與預約編號
- 重要文件備註

### 技術調整

- 擴充 itinerary data model
- 建立 `components/BudgetPanel.tsx`
- 建立 `components/BookingPanel.tsx`
- localStorage schema 加版本管理

### 驗收標準

- 使用者可追蹤每日與總預算
- 重要訂位/訂房/票券資訊可集中管理
- 舊版 localStorage 資料升級時不會壞掉

## Phase 7：AI 智慧規劃

目標：讓使用者從空白開始時，也能快速產生可編輯的初版行程。

### 建議功能

- AI 一鍵產生多日行程
- 根據旅遊風格調整行程，例如親子、慢遊、美食、攝影、購物
- 根據預算產生建議
- 根據住宿位置安排每日路線
- 自動判斷景點順序
- 自動補上用餐、休息、交通時間
- AI 重新安排某一天
- AI 解釋為什麼這樣排

### 技術調整

- 建立 API route 處理 AI 請求，避免 key 暴露在前端
- 建立 `components/AiPlannerDialog.tsx`
- 建立 itinerary JSON schema
- 將 AI 回傳結果轉換成目前的 `DayPlan`
- 加入結果驗證與錯誤修復

### 驗收標準

- 使用者輸入目的地、天數、偏好後可產生初版行程
- AI 產生的結果可以直接被地圖與時間軸使用
- 使用者可以局部重排某一天，而不是整份行程重來

## Phase 8：協作與雲端同步

目標：讓行程能跨裝置、跨使用者共同維護。

### 建議功能

- 使用者登入
- 雲端儲存行程
- 多裝置同步
- 旅伴共同編輯
- 景點投票
- 景點留言
- 分享權限控制
- 公開/私人行程
- 行程版本紀錄

### 技術調整

- 選擇後端方案，例如 Supabase、Firebase、PostgreSQL + API routes
- 建立 auth flow
- 建立 trip/project 資料模型
- 建立 optimistic update
- 加入資料權限檢查

### 驗收標準

- 同一份行程可在不同裝置登入後看到
- 多位旅伴可共同維護行程
- 分享權限可控
- 不再只依賴網址參數或 localStorage

## Phase 9：程式架構與測試

目標：降低後續維護成本，避免功能變多後難以修改。

### 建議重構方向

- 拆分大型 `app/page.tsx`
- 將 UI components、hooks、utils 分層
- 抽出 Google Maps 相關邏輯
- 抽出 route calculation 邏輯
- 抽出 storage/share/export 邏輯
- 統一錯誤處理
- 建立基本測試

### 建議目錄

```txt
app/
  page.tsx
  layout.tsx
components/
  MapView.tsx
  ItineraryPanel.tsx
  ItineraryItem.tsx
  DayTabs.tsx
  DiscoverySection.tsx
  ExportDialog.tsx
  Toast.tsx
hooks/
  useItinerary.ts
  useGoogleRoutes.ts
  useLocalStorage.ts
utils/
  time.ts
  share.ts
  storage.ts
  export.ts
  validation.ts
types/
  itinerary.ts
```

### 測試建議

- 時間計算測試
- 分享連結編碼/解碼測試
- localStorage schema 測試
- 行程排序測試
- 匯出資料格式測試

### 驗收標準

- `app/page.tsx` 不再承擔所有邏輯
- 核心資料轉換邏輯可測試
- 新功能可以在不大幅修改主頁的情況下加入

## 建議開發順序

若以最短時間提高實用度，建議順序如下：

1. Phase 1：基礎穩定與資料保存
2. Phase 2：行程編輯體驗強化
3. Phase 4：手機版與 PWA 體驗
4. Phase 3：時間軸與行程合理性
5. Phase 5：匯出與分享升級
6. Phase 6：預算與旅行資訊管理
7. Phase 7：AI 智慧規劃
8. Phase 8：協作與雲端同步
9. Phase 9：程式架構與測試

若以長期產品化為目標，建議在 Phase 1 後先做 Phase 9 的部分重構，再繼續開發大型功能。

## 第一輪最推薦實作範圍

第一輪建議完成以下項目：

- localStorage 自動儲存與復原
- Day 重新命名、刪除、複製
- 景點移動到其他天
- API key 與錯誤提示
- 手機版行程/地圖分頁
- Toast 提示取代 `alert()`

完成後，這套系統會從展示型旅遊規劃器，提升成可以日常使用的實用工具。
