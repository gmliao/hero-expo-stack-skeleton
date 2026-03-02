# Design System Workflow

> **入口**：[Pencil Integration](./pencil-integration.md)
>  
> **相關文件**：
> [Pen-Code Mapping](./pen-code-component-mapping.md),
> [Color Scheme](./color-scheme.md),
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
