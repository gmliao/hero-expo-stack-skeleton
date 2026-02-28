# Token 參考（間距、圓角、字級、z-index、動效、陰影）

> **用途：** 實作時查詢數值 scale，避免硬編碼。顏色語意見 [color-scheme.md](color-scheme.md)。

**Code 來源：**
- 顏色／圓角／間距／字級（與 Pen 對齊）：`apps/client/src/ui/theme/design-tokens.js`
- 陰影／z-index／動效：`apps/client/src/ui/theme/tokens.ts`（primitiveTokens）

---

## 間距（Spacing）

| Token | px | 用途建議 |
|-------|-----|----------|
| 1 | 4 | 內距微調、icon 與文字間距 |
| 2 | 8 | 小內距、chip 內距 |
| 3 | 12 | 表單欄位間距 |
| 4 | 16 | 卡片內距、區塊間距 |
| 5 | 20 | — |
| 6 | 24 | 區段間距 |
| 7 | 28 | — |
| 8 | 32 | 大區段 |

Tailwind：`p-4`、`gap-3` 等對應上表（來自 design-tokens.spacingPx）。

---

## 圓角（Radii）

| Token | px | 用途 |
|-------|-----|------|
| sm | 8 | 按鈕、輸入框、Card（規格 8） |
| md | 12 | 較大區塊 |
| lg | 16 | 模態、sheet |

---

## 字級（Typography）

**Body：** sm 14 / md 16 / lg 18 / xl 22（px），line-height 由 Tailwind fontSize 定義。

**Display（primitiveTokens）：** sm 24 / md 28 / lg 32（僅數字，用於大標等）。

元件使用 `AppText` 的 size（sm/md/lg/xl）或 display 時，應對應此 scale，不寫死 px。

---

## Z-Index Scale

| Token | 值 | 用途 |
|-------|-----|------|
| base | 0 | 預設層 |
| raised | 10 | 浮起元素（navbar、sticky header） |
| overlay | 40 | 遮罩層 |
| modal | 50 | 模態、sheet、dropdown |

實作時使用 `tokens.zIndex`，避免任意 z-index 數字。

---

## 動效（Motion）

| Token | ms | 用途 |
|-------|-----|------|
| fast | 120 | 微互動（hover、focus 顏色） |
| normal | 200 | 按鈕、開關、小過場 |
| slow | 320 | 模態開關、較明顯過場 |

建議：微互動 150–300ms；避免 >500ms 造成遲滯感。

---

## 陰影（Shadow）

| Token | Tailwind | 用途 |
|-------|----------|------|
| sm | shadow-sm | 輕微浮起 |
| md | shadow | 卡片、輸入框 focus |
| lg | shadow-lg | 模態、浮層 |

目前為 Tailwind 預設陰影名稱，未自訂數值；需一致浮起層級時優先使用 tokens.shadow。

---

## 與 Pen 的對應

- **間距／圓角／字級**：以 design-tokens.js 為準，與 Pen document variables 對齊；改動時 Pen 與 Code 同步。
- **z-index／motion／shadow**：僅在 Code 定義，Pen 可依需要標註在規格或註解中。
