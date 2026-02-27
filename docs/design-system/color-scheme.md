# Color Scheme（語意色 token）

> **用途：** Pen 與 Code 共用同一套語意色。元件應使用這些 token，不要硬編碼 hex。

**Code 來源：** `apps/client/src/ui/theme/semantic.ts`、`apps/client/src/ui/tokens.ts`

---

## Semantic Tokens（語意色）

| Token | Light | Dark | 用途 |
|-------|-------|------|------|
| `bg` | #F1F5F9 (slate100) | #0F172A (navy950) | 頁面背景 |
| `surface` | #FFFFFF | #334155 (slate700) | 卡片、輸入框、浮層背景 |
| `text` | #111827 (slate900) | #F1F5F9 (slate100) | 主要文字 |
| `muted` | #64748B (slate500) | #CBD5E1 (slate300) | 次要文字、placeholder、裝飾 |
| `primary` | #2563EB (blue600) | #3B82F6 (blue500) | 主色、連結、選中 |
| `primarySoft` | #E2E8F0 (slate200) | — | 主色淺底（checkbox 選中） |
| `danger` | #DC2626 (red600) | #DC2626 | 錯誤、刪除 |
| `success` | #16A34A (green600) | #16A34A | 成功、完成 |
| `border` | #CBD5E1 (slate300) | #334155 (slate700) | 邊框 |
| `white` | #FFFFFF | #FFFFFF | 純白（輸入框等） |
| `overlay` | rgba(15,23,42,0.6) | — | 模態遮罩 |
| `focus` | #D4A017 (gold500) | #D4A017 | 焦點環（輔助） |

---

## 元件使用的 Token（參考）

| 元件 | 使用的 Token |
|------|--------------|
| AppCard | surface, border, primary, danger |
| AppButton | primary, surface, border, danger, white (inverse) |
| AppInput / AppTextArea | surface, text, border, primary, danger, success, muted (placeholder) |
| AppFilterChip | primary, border, muted (inactive), white (active text) |
| AppLinkAction | primary |
| AppStatusBar | surface |
| AppSheetHandle | muted |
| AppText (tone) | text, muted, danger, success, white (inverse) |

---

## Pen 使用方式

在 `.pen` 的 document variables 中定義上述 token，元件 fill/stroke 使用變數引用，不要寫死 hex。這樣切換 light/dark 時可一併更新。
