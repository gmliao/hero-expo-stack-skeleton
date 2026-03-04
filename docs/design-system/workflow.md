# Design System Workflow

> **入口**：[Pencil Integration](./pencil-integration.md)
>  
> **相關文件**：
> [Pen-Code Mapping](./pen-code-component-mapping.md),
> [Color Scheme](./color-scheme.md),
> [UI Styling Governance](./styling-governance.md),
> [Pen Gap Spec](./pen-gap-spec.md),
> [Pen Add Card/Input/Stack Runbook](../runbooks/pen-add-card-input-stack.md)

這份文件是 UI 工作的固定流程。只要改 UI、screen、design tokens、shared component，就適用。

## Fixed Order

UI feature workflow 不可跳步。**Agent 與人都須依此順序執行**（AGENTS.md 的 Design System First Workflow 與本表一致）：

1. **先確認 Pen UI** — 在 `.pen` 定稿 layout、semantic variables、reusable components。
2. **再寫 implementation plan** — 產出實作計畫（Pen–code 對應、檔案、rollout 順序）。
3. **再在 code 實作** — 依計畫修改 `apps/client`，並保持 Pen–code 雙向同步。

禁止：

- 先在 code 亂做，之後再回填 Pen
- 跳過 planning 直接改 screen

## Entity / Resource CRUD Checklist（必填）

**適用時機：** 只要 feature 會新增「可持久化的實體/資源」（例如 tag、清單、專案等），在 **scope 與 UI 設計階段** 都必須先填此表，避免漏掉某個操作或入口。

| 操作 | 是否支援 | 發生位置（哪個畫面/Modal） | 備註 |
|------|----------|----------------------------|------|
| **Create** | ☐ 是 / ☐ 否 |  | 例：Modal 內「+ Add tag」、設定頁「新增」 |
| **Read / List** | ☐ 是 / ☐ 否 |  | 例：列表、篩選 chip、picker |
| **Update** | ☐ 是 / ☐ 否 |  | 例：Manage Tags 的 Rename、編輯表單 |
| **Delete** | ☐ 是 / ☐ 否 |  | 例：Manage Tags 的 Delete + 確認；若無刪除需說明原因 |

- **填寫責任：** 概念/scope 文件（如 `scope.md`）與 UI 設計文件（如 `ui-design.md`）都要對齊此表；實作計畫與驗收測試依此檢查。
- **若某操作刻意不做：** 在備註註明原因（例如「僅軟刪除、不提供使用者刪除」）。
- **關聯操作：** 若刪除會影響其他資源（例如刪除 tag 要從所有 todo 的 tagIds 移除），在 scope 的 API/流程裡一併寫清。

## Pen-First Rules

- 先在 `.pen` 定稿 layout、semantic color variables、reusable components
- 若 Pencil MCP 可用，優先用 MCP 查詢或更新
- shared UI 應先在設計系統層解決，不要先堆 screen-level ad hoc 樣式

## Reuse Rules

- 可重用 UI block 應提升為 `reusable: true`
- screen 應用 `ref` instance 消費 shared component
- variants / states 以 component variant 或 instance override 處理
- 跨 screen UI 盡量共用單一 DS/component source

## New Component Rules

建立新 reusable component 前：

1. 先檢查現有 DS area 是否已有等價元件
2. 若沒有，先明確指出 gap
3. 在 shared DS area 新增 reusable component
4. 再由 screen 透過 `ref` 消費

## Screen content padding（畫面水平留白）

- **規範：** 畫面層級（screen frame）套用 **統一的左右 padding**（建議 16–20 px），子區塊**不再**重複加水平 padding，避免標題／篩選貼邊或留白不一致。
- **Pencil：** 在該畫面的 root frame 設 `padding: [0, 20, 0, 20]`（或 16）；區塊（header、filters、list 等）僅設上下 padding 或 gap。
- **對應：** Code 的 screen container（如 `AppScreenContainer` 或 route 最外層）應使用同一數值（見 `design-tokens` / Tailwind）。

## Component internal padding（可重用元件內邊距）

- **需要規範：** 卡片／列表項／輸入框這類「有邊框、包內容」的可重用元件，內部應有**一致內邊距**，避免內容貼邊或各元件視覺不統一。
- **建議數值：**
  - **容器型元件**（Card、TodoItem、Input、Modal 內容區、Sheet 內容）：**16px** 四面（Pen: `padding: 16` 或 `[16,16,16,16]`；Code 對應 p-4 / design-tokens spacing）。
  - **緊湊型元件**（TagBadge、FilterChip、按鈕內文）：依元件規格，例如 6–10px 或 [6,10] 等，以不貼邊、可點擊為準。
- **Pen：** 在 DS 區的 component 定義上直接設好 padding；screen 使用 ref 時不需再覆寫內邊距。
- **例外：** 純裝飾或 inline 元件（SectionLabel、LinkAction、StatusBar）可不設或設 0，由外層控制留白。

## Tag 列／橫向捲動

- **Pen DS 元件：** **component/HorizontalScrollRow (A0Bim)** — 橫向捲動列，內有 contentSlot；方便辨識「此區在 Code 包 ScrollView horizontal」。有 tag 的列（篩選、picker、Manage Tags 行內 tag）可選用此 component 或同款佈局。
- **Frame 命名：** `tagFiltersScrollRow`、`tagsPickerScrollRow` 等表示該區內容需橫向捲動。
- **Code：** 以 **ScrollView horizontal** 包住上述 frame 內容，或使用對應 HorizontalScrollRow 元件。

## Variable-Driven Styling

- 顏色、字體、間距、圓角應優先來自 document variables
- 避免 screen-level hardcoded one-off values
- 如果希望全球可調整，必須由 variable 或 reusable component 驅動

## Styling Decision Procedure

所有 UI styling 決策都必須先套用 [UI Styling Governance](./styling-governance.md) 的三層模型，不得直接把 inline style 當成預設做法。

決策順序固定如下：

1. 先判斷是否能用 **Layer 1 token + Layer 2 utility** 表達
2. 若不能，再判斷是否屬於 **Layer 3 rendering primitive**
3. 若是 Layer 3，必須建立受控 primitive，而不是在 feature code 就地寫 style 例外
4. 若不是 Layer 3，應擴充 token system / shared DS，不得用 ad hoc styling 繞過治理

Phase 2 的 UI/UX 設計輸出必須能回答這三個問題：

- 哪些樣式屬於 token vocabulary？
- 哪些只是 layout composition？
- 哪些地方真的需要 primitive exception？

若設計需要新增 primitive，phase 2 與 implementation plan 至少要記錄：

- 為何 token + utility 不足
- primitive 的 API / 套用場景
- 需要的 component-level verification

## Pen And Code Must Stay Bidirectional

新增 reusable component 時：

- Pen 新增了，code 也要新增對應 component
- code 新增了，Pen 也要補對應 component
- 兩邊都要更新 `pen-code-component-mapping.md`

不要讓 component 只存在單邊。

## Client Consumption Rules

- `apps/client/src/ui/components/**` 暴露 DS primitives 與 variants
- route / feature 只能消費這些 API
- 不要在 route / feature 重新拼接視覺 token 或狀態樣式

## Auto-Adjustable Definition

只有這兩類改動可視為全域自動調整：

1. 改的是共享 variable
2. 改的是透過 `ref` 被重用的 reusable component

如果畫面沒有接 variable / ref，就不要假設它會自動跟著更新。

## Recommended Rollout Order

1. 更新 tokens / semantic variables
2. 更新 reusable components
3. 遷移 screens 到 shared components / refs
4. 移除 legacy duplicated patterns
