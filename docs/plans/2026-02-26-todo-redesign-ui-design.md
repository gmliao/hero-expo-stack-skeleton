# Todo 整體重設計 — 日式小清新 × 旅蛙風 UI

> 設計範圍：功能補齊（1+2+3）、一套設計系統、RWD（mobile / tablet / desktop）同一套元件三種排版。

---

## 1. 設計系統（風格・色彩・字體）

### 1.1 風格定位

- **日式小清新 × 旅蛙感**：溫暖、安靜、留白多、不花俏；圓角、柔和陰影、無銳利線條。
- **圖示**：SVG（Lucide/Heroicons），不用 emoji。
- **互動**：150–250ms 過場、hover/focus 有過渡；主文字對比 ≥ 4.5:1（a11y）。

### 1.2 色彩

| 角色 | Hex | 用途 |
|------|-----|------|
| Background | `#FDF8F3` | 主背景（暖米白） |
| Surface / Card | `#FFFBF7` | 卡片、輸入區底色 |
| Primary | `#7BA05B` | 主按鈕、完成勾選、連結（葉綠） |
| Primary soft | `#E8F0E3` | 按鈕 hover、淺綠底 |
| Text | `#4A3728` | 主文字（暖棕） |
| Text secondary | `#8B7355` | 次要、說明、placeholder |
| Border | `#E8DED5` | 邊線、分隔 |
| Danger | `#C45C4A` | 刪除、錯誤（柔紅） |

### 1.3 字體

- **標題**：Varela Round（圓體、偏手繪感）
- **內文**：Nunito Sans（圓、友善、易讀）
- Web 以 Google Fonts 載入；Tamagui theme 覆寫對應 token。

### 1.4 效果

- 圓角：卡片與按鈕 12–16px（或 Tamagui `$4`）。
- 陰影：`0 2px 8px rgba(74,55,40,0.06)`。
- 過場：150–250ms ease。

---

## 2. RWD 與版面（一套設計，三種排版）

- **同一套**：同一設計系統、同一批元件（TodoItem、按鈕、Modal/Sheet）、同一互動邏輯。
- **變的只有排版**：依視窗寬度用 2～3 個 breakpoint 切換版面，實作方式為 `useWindowDimensions()` 或 Tamagui/Web 的 media/breakpoint。

### 2.1 斷點

| 名稱 | 寬度 | 對象 |
|------|------|------|
| Mobile | &lt; 768px | 手機、Web 窄視窗 |
| Tablet | 768px – 1023px | iPad、Web 平板視窗 |
| Desktop | ≥ 1024px | Web 桌面、iPad 大視窗 |

### 2.2 版面行為

- **Mobile**
  - 單欄列表；卡片全寬；標題列 + 篩選（全部/未完成/已完成）置頂；新增按鈕明顯（≥44pt 觸控）。
  - 新增/編輯：Bottom Sheet 或全屏 Modal。
- **Tablet**
  - 可選：雙欄列表或左列表右詳情；間距與字級略大；Modal 可改為居中彈窗。
- **Desktop**
  - 內容區 max-width（例如 720px）置中；可雙欄卡片或單欄；Modal 居中、不強制全屏。

### 2.3 原生 iOS / Android

- 同一套元件與版面邏輯；不另做「另一套 UI」。
- Safe area、觸控目標 ≥ 44pt、彈性排版；iPad 可依寬度落入 Tablet/Desktop 排版。

---

## 3. 功能範圍與資料

### 3.1 功能清單（1+2+3）

- **1. 補齊既有**
  - 顯示與編輯 **description**（選填）。
  - 編輯 **title**（inline 或彈窗）。
  - **刪除** 一筆（含確認）。
- **2. 篩選**
  - 全部 / 未完成 / 已完成（useUIStore 已有 `filter`）；與 list 查詢串接，**先做 client-side 篩選**（拉全量再篩），之後可改後端支援。
- **3. 到期日**
  - 顯示 **dueDate**（選填）；列表可依到期日排序；建立/編輯表單可選填到期日。

### 3.2 資料與 API

- **shared/types**
  - `Todo` 新增選填欄位：`dueDate?: string`（ISO 或 date-only）。
  - `CreateTodoRequest` / `UpdateTodoRequest` 新增選填：`dueDate?: string`。
- **Backend**
  - 儲存與回傳 `dueDate`；list 回傳順序可支援「依 dueDate 排序」（或前端排序）。
- **App**
  - `useTodosQuery(uid, filter)`：用 `queryKeys.todos.list(uid, filter)`，client-side 依 `filter` 篩選 `completed`；必要時回傳列表依 `dueDate` 排序（前端或後端皆可）。

### 3.3 UI 狀態

- 沿用 **useUIStore**：`filter`、`isCreateModalOpen`、`selectedTodoId`（可作為「正在編輯的 todo」）。
- 新增/編輯 Modal：可共用一個，依 `selectedTodoId` 為 null 或 id 區分「新增」與「編輯」；刪除前可再一層確認（Alert 或小 Modal）。

### 3.4 錯誤與 a11y

- 表單錯誤：顯示在欄位旁或 live region；按鈕 loading 時 disabled。
- 鍵盤與焦點：Web 上 Tab 順序合理、focus 可見；觸控目標 ≥ 44pt。

---

## 4. 小結

- **一套設計**：日式小清新 × 旅蛙風（色彩、字體、圓角、陰影）。
- **一套元件**：同一套 TodoItem、篩選、新增/編輯 Modal、刪除確認。
- **RWD**：同一 codebase，依寬度切 mobile / tablet / desktop 三種排版；Web + iOS（含 iPad）共用，不拆成三套獨立設計。
- **功能**：1（description、編輯 title、刪除）+ 2（全部/未完成/已完成篩選）+ 3（dueDate 顯示與排序）；API 與 shared types 補上 `dueDate`，篩選先 client-side。

此文件經確認後，將交由 **writing-plans** 產出實作計畫（含任務拆解與先後順序）。
