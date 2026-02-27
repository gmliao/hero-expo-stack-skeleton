# Pen 待補元件規格

> **用途：** Code 已有、Pen 尚缺的元件。在 Pencil 開啟 `app-core-screens.pen` 後，於 DS Components 區依此規格新增。

**對應表：** `docs/design-system/pen-code-component-mapping.md`  
**顏色 token：** `docs/design-system/color-scheme.md`

---

## 1. component/Card（對應 AppCard）

| 屬性 | 規格 |
|------|------|
| 用途 | 卡片容器，用於 TodoItem、表單區塊等 |
| 結構 | 單一 frame，`reusable: true` |
| 尺寸 | 自適應寬度，min-height 依內容 |
| 樣式 | `rounded-md` (8px)、`border`、`p-4` (16px) |
| 顏色 token | bg: `surface`，border: `border` / `primary` / `danger`（見 color-scheme） |
| 狀態 | default: border-border |
|  | hover/focus: border-2 border-primary |
|  | error: border-2 border-danger |
|  | disabled: border-border, opacity 60% |

---

## 2. component/Input（對應 AppInput）

| 屬性 | 規格 |
|------|------|
| 用途 | 單行文字輸入，可作為 Field 的子元件 |
| 結構 | 單一 text input 或等同 frame，`reusable: true` |
| 尺寸 | md: h-48px (12*4), px-16, text-16 |
| 樣式 | `rounded-md`、`border` |
| 顏色 token | bg: `white`，text: `text`，border: `border` / `primary` / `danger` / `success`，placeholder: `muted` |
| 狀態 | default: border-border |
|  | focused: border-2 border-primary |
|  | invalid: border-2 border-danger |
|  | success: border-2 border-success |
|  | disabled: opacity 70% |

---

## 3. component/Stack（對應 AppStack）

| 屬性 | 規格 |
|------|------|
| 用途 | 佈局容器，垂直或水平排列，可設 gap |
| 結構 | 單一 frame，`reusable: true`，子節點為 slot |
| 方向 | vertical (flex-col) / horizontal (flex-row) |
| gap | 0–8 對應 0–32px (spacing scale) |
| 樣式 | 無背景、無邊框，純佈局 |

---

## 新增後

1. 在 `pen-code-component-mapping.md` 填入 Pen ID
2. 在 DS 區的 product screens 中，將對應的 raw 節點改為 `ref` 引用

**執行方式：** Pencil 開啟時，依 `docs/runbooks/pen-add-card-input-stack.md` 執行 MCP 操作可一次新增 Card、Input、Stack。
