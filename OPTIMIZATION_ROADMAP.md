# 旅遊規劃器分階段優化 Roadmap

本文件整理目前系統可優化方向，依照「使用者價值、開發成本、產品完整度」分成多個階段。建議先完成基礎穩定性，再逐步加入智慧規劃與協作功能。

## 最新進度摘要

目前已完成 Phase 1、Phase 2、Phase 3、Phase 4、Phase 5、Phase 6。

### 已完成重點

- localStorage 自動儲存與復原
- Toast 提示與 API 錯誤提示
- 清空全部行程
- Day 新增、重新命名、複製、刪除
- 景點移動/複製到其他 Day
- 每日備註
- 行程總覽模式
- 手動新增自訂地點
- 無地址備忘項目
- 每日預估結束時間
- 景點數、總停留時間、總交通時間統計
- 行程過滿、午餐/晚餐時段提醒
- Google Places 營業時間文字顯示
- 營業時間衝突提醒
- 自動插入午餐/晚餐時間
- 指定日期天氣預報
- 手機版行程 / 地圖切換
- 手機版底部固定操作列與一鍵導航
- PWA 安裝提示與 service worker 基礎離線快取
- 完整離線 fallback 頁面與 PWA icon
- 文字版行程摘要複製
- CSV 行程匯出
- Excel、iCal、Google Calendar、LINE 分享
- 預算追蹤、付款狀態與預約編號
- 訂房、航班、票券與重要文件集中備註

### 目前未完成但優先度高

- Phase 9：拆分 `app/page.tsx`，降低後續維護成本
- Phase 9：持續拆分匯出、分享、storage 邏輯

### 驗證狀態

- 已執行 `git diff --check`，未發現空白錯誤
- 尚未完成 `npm run build` 驗證，因目前 shell 找不到 `node` / `npm`

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

- 行程已可自動儲存在 localStorage，但尚未做 schema 版本管理
- 大部分功能集中在單一 `app/page.tsx`，後續維護成本會上升
- API 錯誤提示已有基礎，但載入狀態與空狀態仍可再細緻化
- 手機版已具備行程/地圖切換，但 PWA 與離線能力尚未補齊
- 缺少 AI 自動規劃、協作同步等進階能力

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

## Phase 2：行程編輯體驗強化（已完成）

目標：讓多日旅遊規劃更完整，支援實際旅行安排中的常見操作。

### 建議功能

- Day 重新命名（本階段實作）
- Day 刪除（本階段實作）
- Day 複製（本階段實作）
- 景點移動到其他天（本階段實作）
- 景點複製到其他天（本階段實作）
- 每日備註（本階段實作）
- 行程總覽模式（本階段實作）
- 每日景點數、總交通時間、總停留時間統計（本階段實作）
- 手動新增自訂地點（本階段實作）
- 支援無地址的備忘項目，例如「集合」、「休息」、「購物時間」（本階段實作）

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
- 已加入每日備註
- 已加入每日景點數、總交通時間、總停留時間統計
- 已加入行程總覽模式，可跨 Day 檢視日期、時間、停留、交通、備註與項目清單
- 已加入手動新增自訂地點，可輸入名稱、地址與停留時間
- 已加入無地址備忘項目，可用於集合、休息、購物時間等非 Google 地點安排
- 已補上自訂項目表單、總覽視窗與項目類型標籤樣式
- 已修正切換 Day 後立即重算路線時可能寫回錯誤 Day 的風險
- 已執行靜態差異檢查；目前 shell 找不到 `node` / `npm`，尚無法執行 Next.js 建置驗證

### 尚未完成項目

- 無

## Phase 3：時間軸與行程合理性（已完成）

目標：讓系統不只是記錄景點，而是能幫使用者判斷行程是否合理。

### 建議功能

- 營業時間顯示（本階段實作）
- 營業時間衝突提醒（本階段實作）
- 行程太趕提醒（本階段實作）
- 每日結束時間預估（本階段實作）
- 午餐/晚餐時段提醒（本階段實作）
- 自動插入用餐時間（本階段實作）
- 停留時間快速自訂（既有功能）
- 支援不同日期的天氣預報（本階段實作）
- 顯示交通時間累計（本階段實作）

### 技術調整

- 建立 `utils/time.ts`（已完成）
- 建立 `utils/validation.ts`（暫以 `utils/time.ts` 內 pure functions 承擔）
- 在 `ItineraryItem` 補上 opening hours，並於 summary 顯示 warning
- 將 schedule 計算抽成 pure function，方便測試（已完成）

### 驗收標準

- 系統能提示「此景點抵達時可能已關門」
- 系統能提示「今日行程可能太緊」
- 使用者可清楚看到每日出發與結束時間
- 時間計算邏輯可以被獨立測試

### 完成紀錄

- 已加入每日預估結束時間
- 已加入景點數、總停留時間、總交通時間統計
- 已加入行程偏滿與 12 小時以上提醒
- 已加入午餐/晚餐時段提醒
- 已保存並顯示 Google Places 營業時間文字
- 已加入營業時間衝突判斷，抵達時可能未營業會提示
- 已加入一鍵插入午餐 / 晚餐時間
- 已加入 Day 日期欄位與指定日期天氣更新
- 已將時間計算抽成 `utils/time.ts` pure functions

## Phase 4：手機版與 PWA 體驗（已完成）

目標：讓使用者在旅途中也能順暢使用，而不只是桌面規劃工具。

### 建議功能

- 手機版「行程 / 地圖」分頁（本階段實作）
- 底部固定主要操作列（本階段實作）
- 一鍵開啟目前行程導航（本階段實作）
- 景點卡片手機版壓縮資訊（本階段實作）
- 離線檢視已保存行程（本階段實作）
- PWA 安裝提示（本階段實作）
- 加入 service worker 快取基礎頁面與靜態資源（本階段實作）
- 更完整的離線 fallback 頁面（本階段實作）
- 針對地圖外部資源的快取策略細分（本階段實作）

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

### 完成紀錄

- 已加入手機版行程 / 地圖切換狀態
- 已加入手機底部固定切換列
- 已加入手機底部一鍵導航
- 手機版行程與地圖改為單一檢視切換，減少上下滑動
- 已加入 PWA 安裝提示
- 已註冊 service worker，快取基礎 app shell 與已請求資源
- 已加入手機版景點卡片壓縮樣式
- 已加入 `/offline.html`，網路中斷且無可用快取時提供清楚的離線說明與回到行程入口
- 已補上 `/icon.svg`，讓 manifest 與 PWA 安裝圖示可正常載入
- 已將 service worker 快取策略拆分為 app shell、同源 runtime cache、Google 外部資源 network-only
- 已避免 Google Maps / Google APIs / gstatic 等外部地圖資源被盲目寫入 runtime cache
- 已執行靜態差異檢查；目前 shell 找不到 `node` / `npm`，尚無法執行 Next.js 建置驗證

### 尚未完成項目

- 無

## Phase 5：匯出與分享升級（已完成）

目標：讓行程可以更容易交給旅伴、列印、存檔或放進其他工具。

### 建議功能

- PDF 匯出（本階段實作，透過列印視窗另存 PDF）
- CSV / Excel 匯出（本階段實作）
- Google Calendar / iCal 匯出（本階段實作）
- 文字版行程摘要（本階段實作）
- LINE 分享格式（本階段實作）
- 可選擇匯出單日或全部天數（本階段實作）
- 海報模板選擇（本階段實作）
- 分享連結壓縮，避免網址過長（本階段實作）

### 技術調整

- 建立 `utils/export.ts`（本階段實作）
- 建立 `components/ExportDialog.tsx`（本階段實作）
- 考慮使用短連結後端或雲端儲存方案（已評估：本階段先以前端 gzip 壓縮降低網址長度）
- 分離 poster render component（本階段實作）

### 驗收標準

- 使用者可匯出 PDF/文字/圖片至少三種格式
- 分享內容可被旅伴直接理解
- 多日行程可以一次完整匯出
- 長行程分享連結不會過長或失敗

### 完成紀錄

- 已加入文字版行程摘要產生與複製
- 已加入 CSV 行程匯出
- 已抽出 `buildSchedule` 供目前畫面與匯出功能共用
- 已加入匯出對話框
- 已加入目前 Day / 全部天數匯出範圍切換
- 已加入 PDF 列印視窗，可由瀏覽器另存成 PDF
- 已將海報 PNG 匯出整合進匯出對話框
- 已建立 `utils/export.ts`，集中處理文字摘要、CSV、xlsx、iCal、Google Calendar、LINE 與分享連結編碼
- 已建立 `components/ExportDialog.tsx`，將匯出對話框從主頁抽出
- 已建立 `components/PosterRender.tsx`，將海報 render 結構從主頁抽出
- 已加入 Excel xlsx 匯出
- 已加入 iCal `.ics` 匯出
- 已加入 Google Calendar 新增事件入口
- 已加入 LINE 分享格式
- 已加入 Classic / Timeline / Compact 三種海報模板
- 已加入 gzip 分享連結壓縮，並保留舊版分享連結讀取相容
- 已執行靜態差異檢查；目前 shell 找不到 `node` / `npm`，尚無法執行 Next.js 建置驗證

### 尚未完成項目

- 無

## Phase 6：預算與旅行資訊管理（已完成）

目標：將系統從「路線規劃器」升級為「完整旅行規劃器」。

### 建議功能

- 每個景點加入預估費用（本階段實作）
- 餐費、交通、住宿、門票分類（本階段實作）
- 每日預算統計（本階段實作）
- 全旅程預算統計（本階段實作）
- 幣別設定（本階段實作）
- 付款狀態（本階段實作）
- 訂房資訊（本階段實作）
- 航班資訊（本階段實作）
- 票券與預約編號（本階段實作）
- 重要文件備註（本階段實作）

### 技術調整

- 擴充 itinerary data model（本階段實作）
- 建立 `components/BudgetPanel.tsx`（本階段實作）
- 建立 `components/BookingPanel.tsx`（本階段實作）
- localStorage schema 加版本管理（本階段實作）

### 驗收標準

- 使用者可追蹤每日與總預算
- 重要訂位/訂房/票券資訊可集中管理
- 舊版 localStorage 資料升級時不會壞掉

### 完成紀錄

- 已在 `ItineraryItem` 增加 `cost`、`costCategory`、`paymentStatus`、`reservationCode`
- 已新增 `TripInfo` 與 `TripBookingInfo`，集中管理幣別、總預算、訂房、航班、票券、文件與緊急聯絡
- 已建立 `components/BudgetPanel.tsx`，顯示每日預算、全旅程預算、剩餘預算與分類統計
- 已建立 `components/BookingPanel.tsx`，集中編輯住宿、航班、票券預約與重要文件備註
- 已在景點卡片加入費用、分類、付款狀態與票券/預約編號欄位
- 已將 localStorage schema 升級為 version 2，並保留舊資料讀取相容
- 已將費用與預約編號納入文字摘要、CSV 與 Excel 匯出
- 已執行靜態差異檢查；目前 shell 找不到 `node` / `npm`，`tsc` 也因缺少 `node` 無法啟動，尚無法執行 Next.js 建置驗證

### 尚未完成項目

- 無

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

## Phase 9：程式架構與測試（進行中）

目標：降低後續維護成本，避免功能變多後難以修改。

### 建議重構方向

- 拆分大型 `app/page.tsx`
- 將 UI components、hooks、utils 分層（本階段開始）
- 抽出 Google Maps 相關邏輯
- 抽出 route calculation 邏輯
- 抽出 storage/share/export 邏輯
- 統一錯誤處理
- 建立基本測試

### 完成紀錄

- 已新增 `types/itinerary.ts`
- 已將 `Place`、`ItineraryItem`、`DayPlan` 型別自 `app/page.tsx` 抽出
- 已新增 `utils/time.ts`
- 已將 `addMinutes`、`parseDur`、`formatMinutes`、`timeToMinutes`、`crossesTimeWindow`、`buildSchedule` 抽出
- `app/page.tsx` 已改為匯入共用型別與時間工具
- 已在 Phase 5 抽出 `components/ExportDialog.tsx`
- 已在 Phase 5 抽出 `components/PosterRender.tsx`
- 已在 Phase 5 抽出 `utils/export.ts`

### 尚未完成項目

- 抽出 `components/ItineraryItem.tsx`
- 抽出 `components/MapView.tsx`
- 抽出 `hooks/useItinerary.ts`
- 抽出 `utils/share.ts`
- 抽出 `utils/storage.ts`
- 建立時間計算與分享編碼測試

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

目前 Phase 1、Phase 2、Phase 3、Phase 4、Phase 5、Phase 6 已完成。後續建議順序如下：

1. Phase 9：繼續拆分行程卡片、地圖、分享與 storage 邏輯
2. Phase 7：AI 智慧規劃
3. Phase 8：協作與雲端同步
4. Phase 9：補時間計算單元測試

若以長期產品化為目標，建議下一輪持續做 Phase 9 重構，避免 `app/page.tsx` 再度膨脹。

## 第一輪最推薦實作範圍

第一輪建議完成以下項目：

- localStorage 自動儲存與復原
- Day 重新命名、刪除、複製
- 景點移動到其他天
- API key 與錯誤提示
- 手機版行程/地圖分頁
- Toast 提示取代 `alert()`

目前第一輪項目已完成。下一輪建議聚焦：

- `ExportDialog` 元件抽出
- 匯出工具抽出
- 分享工具抽出
- localStorage schema 版本管理
