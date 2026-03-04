# Color Scheme（語意色 token）

> **用途：** Pen 與 Code 共用同一套語意色，以 Pen 為主。元件應使用這些 token，不要硬編碼 hex。

**來源：** 以 Pen（`pencil/app/app-core-screens.pen`）的 document variables 為主，Code 對齊 Pen。

**單一來源（Code）：** `apps/client/src/ui/theme/design-tokens.js`  
- Tailwind（`tailwind.config.js`）與 app（`tokens.ts`、`semantic.ts`）都從此檔讀取，顏色／圓角／間距／字級只改這一處即可一致。

---

## Semantic Tokens（語意色）

| Token | Light（Pen 為主） | Dark | 用途 |
|-------|-------------------|------|------|
| `bg` | #F0FDFA | #0F172A (navy950) | 頁面背景 |
| `surface` | #FFFFFF | #334155 (slate700) | 卡片、輸入框、浮層背景 |
| `text` | #134E4A | #F1F5F9 (slate100) | 主要文字 |
| `muted` | #0F766E | #CBD5E1 (slate300) | 次要文字、placeholder、裝飾 |
| `primary` | #0D9488 | #3B82F6 (blue500) | 主色、連結、選中 |
| `primarySoft` | #CCFBF1 | — | 主色淺底（checkbox 選中） |
| `danger` | #ef4444 | #ef4444 | 錯誤、刪除 |
| `success` | #16A34A | #16A34A | 成功、完成 |
| `border` | #99f6e4 | #334155 (slate700) | 邊框 |
| `white` | #FFFFFF | #FFFFFF | 純白（輸入框等） |
| `overlay` | rgba(15,23,42,0.6) | — | 模態遮罩 |
| `focus` | #D4A017 | #D4A017 | 焦點環（輔助） |

**Dark 主題補充：** `primarySoft`、`white`、`overlay` 目前僅在 light 語意表列出；dark 若需使用可由 primitiveTokens 或沿用 light 定義，必要時在 `semantic.ts` 補上。

### Tag Palette Tokens（phase 2）

| Token | Light | 用途 |
|-------|-------|------|
| `tagTealBg` / `tagTealText` / `tagTealBorder` | `#CCFBF1` / `#115E59` / `#5EEAD4` | 預設 tag palette |
| `tagBlueBg` / `tagBlueText` / `tagBlueBorder` | `#DBEAFE` / `#1D4ED8` / `#93C5FD` | 資訊 / 專案 |
| `tagGreenBg` / `tagGreenText` / `tagGreenBorder` | `#DCFCE7` / `#166534` / `#86EFAC` | 生活 / 完成感 |
| `tagAmberBg` / `tagAmberText` / `tagAmberBorder` | `#FEF3C7` / `#92400E` / `#FCD34D` | 注意 / 等待 |
| `tagRoseBg` / `tagRoseText` / `tagRoseBorder` | `#FFE4E6` / `#BE123C` / `#FDA4AF` | 個人 / 高優先 |

這組 token 只供 tag system 使用。使用者不可自由輸入顏色，只能從 allowlist 選。

---

## 元件使用的 Token（參考）

| 元件 | 使用的 Token |
|------|--------------|
| AppCard | surface, border, primary, danger |
| AppButton | primary, surface, border, danger, white (inverse) |
| AppInput / AppTextArea | surface, text, border, primary, danger, success, muted (placeholder) |
| AppFilterChip | primary, border, muted (inactive), white (active text) |
| AppTagBadge | `tag*Bg`, `tag*Text`, `tag*Border`, white (active text) |
| AppTagChip | `tag*Text`, `tag*Border`, surface (inactive bg), white (active text) |
| AppLinkAction | primary |
| AppStatusBar | surface |
| AppSheetHandle | muted |
| AppText (tone) | text, muted, danger, success, white (inverse) |

### Tag surface usage rules

- Todo list badge row: `AppTagBadge`
- Create/Edit Todo picker row: `AppTagChip`
- Tag filter row: `AppTagChip` (`All` uses the generic active state)
- Manage Tags preview row: `AppTagBadge`
- Tag form preview: `AppTagBadge`

這些 surface 都必須直接使用 tag palette tokens；不能只在 Manage Tags form 裡選到顏色，其他地方卻退回預設顯示。

---

## Pen 使用方式

在 `.pen` 的 document variables 中定義上述 token，元件 fill/stroke 使用變數引用，不要寫死 hex。Code 的 light 語意色已對齊 Pen；變更顏色時請先改 Pen，再同步到 Code。
