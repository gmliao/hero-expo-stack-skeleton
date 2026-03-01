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

UI feature workflow 不可跳步：

1. 先確認 Pen UI
2. 再寫 implementation plan
3. 再在 code 實作

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
