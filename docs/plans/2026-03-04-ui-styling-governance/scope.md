# Scope: UI Styling Governance

## Problem

目前專案已有 Design System First workflow、Variable-Driven Styling、NativeWind 優先等規則，但缺少一份明確的 UI styling 治理模型。

結果是：

1. `workflow` 文件只定義流程，沒有一套可重複判斷的 styling decision tree。
2. `client architecture` 只有粗粒度規則，對 inline style、StyleSheet、primitive 例外的邊界不夠精確。
3. AI agent、code review、未來 lint / CI 難以一致判斷某段樣式屬於 token、utility，還是受控例外。

## Goal

建立一份可治理、可機器化引用的三層 UI styling 模型，並把它接到現有的 UI workflow 與 client architecture。

## Decision

採用三份文件分工，而不是只把規則塞進單一文件：

1. `docs/design-system/styling-governance.md`
   - 作為三層模型的 canonical spec
   - 定義 Layer 1 / 2 / 3、allowed / forbidden、decision tree、primitive 交付要求
2. `docs/design-system/workflow.md`
   - 作為 UI 工作的 decision procedure
   - 規定 UI styling 決策必須先走三層模型
3. `docs/architecture/client.md`
   - 作為 client code 的 enforcement rule
   - 規定 route / feature / `src/ui` 的 styling 邊界與例外

## Scope

### Included

- 新增 `docs/design-system/styling-governance.md`
- 更新 `docs/design-system/workflow.md`
- 更新 `docs/architecture/client.md`
- 在 feature plan 文件中定義未來 lint / CI 可用的 machine-checkable heuristics

### Excluded

- 本次不新增 ESLint rule / codemod / CI check
- 本次不搬移現有 component 到 `src/ui/primitives/**`
- 本次不修改 Pen 檔或新增 `.pen` reusable component
- 本次不重寫既有 UI component API

## Proposed Governance Model

### Layer 1: Design Token Layer

所有視覺語彙必須來自 token system。適用範圍包含：

- color
- typography
- spacing
- radius
- shadow
- border
- z-index

禁止以 hardcoded literal 或 arbitrary value 直接表達上述語彙。

### Layer 2: Utility Layer

使用 NativeWind / Tailwind utility 組合 layout 與 alignment。適用範圍包含：

- display
- flex / grid
- alignment
- overflow
- position

Layer 2 不建立新的視覺語彙，只負責組合 Layer 1 token 與 layout utility。

### Layer 3: Primitive Layer

當 Layer 1 + 2 無法表達某些 runtime rendering 行為時，可建立受控 primitive component，封裝必要的 inline style / StyleSheet。

允許類型：

- `maskImage`
- `WebkitMaskImage`
- `clipPath`
- `transform`
- 少數平台互通所需的 rendering / geometry primitive

禁止類型：

- `color`
- `backgroundColor`
- `fontSize`
- `padding`
- `margin`
- `shadow*`
- `borderRadius`

這些仍屬於 Layer 1 token 治理範圍。

## Decision Flow

任何 UI styling 需求都依照以下順序判斷：

1. 能否用 token + utility 表達？
2. 若不能，是否屬於 rendering primitive？
3. 若是，建立 `src/ui/primitives/**` primitive component。
4. 若不是，應擴充 token system / DS，而不是直接寫 inline style。

## Success Criteria

1. Repo 內存在單一 canonical styling governance spec。
2. `workflow` 與 `client architecture` 都引用同一套三層模型，而不是各自重寫定義。
3. 文件文字足夠精確，可作為 AI agent / code review / 未來 lint 規則的依據。
4. 現有 `AppHorizontalScrollArea` 這類案例能被明確歸類為 Layer 3 primitive，而非 ad hoc exception。

## Phase Mapping

- Phase 1: 本文件作為 scope / design output
- Phase 2: N/A，本次不涉及 Pen screen / layout 定稿
- Phase 3/4: 以 implementation plan 把文件改動拆成可執行步驟
- Phase 5: 依計畫更新 docs，並做 docs-level verification
