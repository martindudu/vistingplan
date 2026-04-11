# 🔧 npm 安裝錯誤解決方案

## 錯誤說明

你遇到的錯誤是：
```
EPERM: operation not permitted, mkdir 'D:\'
```

這表示 npm 試圖在 `D:\` 根目錄創建文件夾，但沒有權限。

## 解決方案

### 方法 1：重置 npm 配置（推薦）

在專案目錄下執行以下命令：

```bash
# 檢查當前配置
npm config list

# 重置 prefix（如果指向錯誤位置）
npm config delete prefix

# 重置 cache 位置（如果需要）
npm config set cache "C:\Users\你的用戶名\AppData\Local\npm-cache" --global

# 清除 npm 快取
npm cache clean --force
```

### 方法 2：使用管理員權限

1. **以管理員身份開啟 PowerShell 或命令提示字元**
   - 右鍵點擊「開始」按鈕
   - 選擇「Windows PowerShell (管理員)」或「命令提示字元 (管理員)」

2. **切換到專案目錄**
   ```bash
   cd "D:\ai設計\旅遊規劃器"
   ```

3. **重新安裝依賴**
   ```bash
   npm install
   ```

### 方法 3：檢查並修正 npm 配置

在專案目錄下執行：

```bash
# 檢查 prefix 設定
npm config get prefix

# 如果返回 D:\ 或類似的根目錄，重置它
npm config set prefix "%APPDATA%\npm" --global

# 或者使用用戶目錄
npm config set prefix "%LOCALAPPDATA%\npm" --global
```

### 方法 4：刪除 node_modules 和 package-lock.json 後重新安裝

```bash
# 刪除 node_modules 資料夾（如果存在）
rmdir /s /q node_modules

# 刪除 package-lock.json（如果存在）
del package-lock.json

# 清除 npm 快取
npm cache clean --force

# 重新安裝
npm install
```

### 方法 5：檢查專案路徑

確保專案路徑中沒有特殊字符導致問題：

```bash
# 當前路徑
cd

# 如果路徑有問題，可以移動專案到更簡單的路徑
# 例如：C:\projects\travel-planner
```

## 快速修復步驟

1. **以管理員身份開啟 PowerShell**

2. **執行以下命令序列：**
   ```powershell
   # 切換到專案目錄
   cd "D:\ai設計\旅遊規劃器"
   
   # 重置 npm 配置
   npm config delete prefix
   npm config set cache "$env:LOCALAPPDATA\npm-cache" --global
   
   # 清除快取
   npm cache clean --force
   
   # 刪除舊的 node_modules（如果存在）
   if (Test-Path node_modules) {
       Remove-Item -Recurse -Force node_modules
   }
   
   # 刪除 package-lock.json（如果存在）
   if (Test-Path package-lock.json) {
       Remove-Item -Force package-lock.json
   }
   
   # 重新安裝
   npm install
   ```

## 驗證修復

安裝完成後，驗證是否成功：

```bash
# 檢查 node_modules 是否存在
dir node_modules

# 檢查是否可以運行開發伺服器
npm run dev
```

## 如果問題持續存在

1. **檢查防毒軟體**
   - 暫時關閉防毒軟體
   - 將專案目錄加入防毒軟體白名單

2. **檢查檔案權限**
   - 確保對專案目錄有完整讀寫權限

3. **使用 yarn 替代**
   ```bash
   # 安裝 yarn
   npm install -g yarn
   
   # 使用 yarn 安裝依賴
   yarn install
   ```

4. **檢查 Node.js 版本**
   ```bash
   node --version
   # 應該使用 Node.js 18 或更高版本
   ```

## 常見問題

### Q: 為什麼會出現這個錯誤？
A: 通常是 npm 配置中的 `prefix` 設定錯誤，指向了系統根目錄。

### Q: 需要重新安裝 Node.js 嗎？
A: 通常不需要，重置 npm 配置即可。

### Q: 會影響其他專案嗎？
A: 如果使用 `--global` 標誌，會影響全域配置。建議只重置必要的配置。

## 成功標誌

當你看到以下訊息時，表示安裝成功：

```
added XXX packages, and audited XXX packages in XXs
```

然後可以運行：

```bash
npm run dev
```

訪問 http://localhost:3000 查看應用程式。
