# Custom Timer Board

一個可直接部署到 GitHub Pages 的靜態計時看板。點選 1–60 的任一按鈕後，網頁會依照設定的分鐘數計算目標時間，並用不同顏色顯示一般、即將到期與已到期狀態。

## 功能

- 60 個獨立計時按鈕
- 可設定 1–1440 分鐘的計時長度
- 即時時鐘與目標時間顯示
- 剩餘 10 分鐘內與逾時狀態提示
- 使用瀏覽器 `localStorage` 保存資料
- 支援桌面與行動裝置
- 不需要伺服器或資料庫

## 本機使用

直接用瀏覽器開啟 `index.html` 即可使用。

若要透過本機伺服器預覽，也可以在專案資料夾執行：

```powershell
python -m http.server 8000
```

然後開啟 <http://localhost:8000>。

## 發布到 GitHub Pages

1. 在 GitHub 建立新的儲存庫。
2. 將本專案所有檔案上傳到儲存庫的預設分支。
3. 開啟儲存庫的 **Settings > Pages**。
4. 在 **Build and deployment** 將來源設為 **Deploy from a branch**。
5. 選擇預設分支與 `/(root)`，然後按 **Save**。
6. 等待 GitHub 完成部署，Pages 頁面會顯示公開網址。

## 資料保存方式

所有計時資料只保存在目前瀏覽器的 `localStorage` 中，不會上傳到 GitHub 或其他伺服器。更換瀏覽器、裝置或清除網站資料後，紀錄不會自動同步或保留。

## 專案結構

```text
.
├── index.html
├── styles.css
├── app.js
├── .nojekyll
└── README.md
```
