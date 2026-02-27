# Pen ↔ Code Component Mapping

> **用途：** 查詢 `.pen` 可重用元件與 `@/ui/components` 的對應關係。新增元件時必須同步更新此表。

**來源：** `pencil/app/app-core-screens.pen` ↔ `apps/client/src/ui/components/**`

**顏色 token：** 元件使用的語意色見 `docs/design-system/color-scheme.md`

---

## Pen 畫面 ↔ Code 路由（Screens）

| Pen Screen (frame name) | Pen ID | Code Route |
|-------------------------|--------|------------|
| Login | hooV6 | (auth)/login.tsx |
| Sign Up | Z8Qyn | (auth)/sign-up.tsx |
| Todos | u57V2 | (app)/index.tsx |
| Create Todo Modal | Aa59O | CreateTodoModal (sheet) |
| **Options** | **O4CjV** | **(app)/options.tsx** |

---

## Pen → Code（依 Pen 元件查 Code）

| Pen Component | Pen ID | Code Component | Source File |
|---------------|--------|----------------|-------------|
| component/Card | QaOPf | AppCard | AppCard.tsx |
| component/Field | ogBSt | AppField | AppField.tsx |
| component/Input | toRVp | AppInput | AppInput.tsx |
| component/PrimaryButton | 3IKQy | AppButton | AppButton.tsx (variant=primary)。**規格以 spec/Button States 為準**：cornerRadius 8、height 44 |
| component/LinkAction | 9eh24 | AppLinkAction | AppLinkAction.tsx |
| component/OutlineButton | C1f9F | AppButton | AppButton.tsx (variant=outline)。**規格以 spec/Button States 為準**：cornerRadius 8、height 44 |
| component/FilterChipActive | edQQ4 | AppFilterChip | AppFilterChip.tsx (active=true) |
| component/FilterChip | uSf0r | AppFilterChip | AppFilterChip.tsx (active=false) |
| component/Stack | S6wSM | AppStack | AppStack.tsx |
| component/TodoItem | bEjH4 | TodoItem | features/todos/TodoItem.tsx |
| component/TextArea | JEOdo | AppTextArea | AppTextArea.tsx |
| component/StatusBar | l5b7W | AppStatusBar | AppStatusBar.tsx |
| component/ScreenTitle | T5cMs | AppText | AppText.tsx (size=xl, weight=bold) |
| component/SectionLabel | Z7k3d | AppText | AppText.tsx (size=sm, tone=muted) |
| component/SheetHandle | McPgO | AppSheetHandle | AppSheetHandle.tsx |

---

## Code → Pen（依 Code 元件查 Pen）

| Code Component | Source File | Pen Component | Pen ID |
|----------------|-------------|---------------|--------|
| AppButton | AppButton.tsx | PrimaryButton, OutlineButton | 3IKQy, C1f9F |
| AppCard | AppCard.tsx | component/Card | QaOPf |
| AppField | AppField.tsx | component/Field | ogBSt |
| AppFilterChip | AppFilterChip.tsx | FilterChip, FilterChipActive | uSf0r, edQQ4 |
| AppInput | AppInput.tsx | component/Input | toRVp |
| AppLinkAction | AppLinkAction.tsx | component/LinkAction | 9eh24 |
| AppScreenContainer | AppScreenContainer.tsx | （版面用）畫面內容最大寬度 720、置中，desktop 才限寬 |
| AppSheetHandle | AppSheetHandle.tsx | component/SheetHandle | McPgO |
| AppStack | AppStack.tsx | component/Stack | S6wSM |
| AppStatusBar | AppStatusBar.tsx | component/StatusBar | l5b7W |
| AppText | AppText.tsx | ScreenTitle, SectionLabel | T5cMs, Z7k3d |
| AppTextArea | AppTextArea.tsx | component/TextArea | JEOdo |
| TodoItem | features/todos/TodoItem.tsx | component/TodoItem | bEjH4 |

---

## Pen Variable ↔ Code Token

| Pen Variable | Code Token | 說明 |
|--------------|------------|------|
| `bg` | `tokens.colors.bg` | 頁面背景（語意主入口） |
| `surface` | `tokens.colors.surface` | 卡片/輸入框背景 |
| `text` | `tokens.colors.text` | 主要文字 |
| `muted` | `tokens.colors.muted` | 次要文字/placeholder |
| `primary` | `tokens.colors.primary` | 主色 |
| `danger` | `tokens.colors.danger` | 錯誤/危險 |
| `success` | `tokens.colors.success` | 成功 |
| `border` | `tokens.colors.border` | 邊框 |
| `white` | `tokens.colors.white` | 反白文字/特殊用途 |
| `overlay` | `tokens.colors.overlay` | 遮罩 |
| `focus` | `semanticColors.light.focus` / `semanticColors.dark.focus` | 焦點環 |

### Legacy / Alias in Pen

| Pen Variable | 建議用途 |
|--------------|----------|
| `background` | 舊版背景命名，建議由 `bg` 統一引用 |
| `textMuted` | 舊版次要文字命名，建議由 `muted` 統一引用 |
| `cta` | 舊版 CTA 色，若進入語意系統建議整併到 `primary`（或另立語意 token） |

---

## 更新規則

- **Pen 新增元件** → 實作對應 Code 元件 → 更新此表
- **Code 新增元件** → 在 Pen DS 區新增對應元件 → 更新此表
- 新增元件時同步更新此表
