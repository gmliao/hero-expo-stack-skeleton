# UI Styling Governance

> **角色定位：** 本文件是 UI styling policy 的單一來源（canonical spec）。
>
> **相關文件**：
> [Design System Workflow](./workflow.md),
> [Client Architecture](../architecture/client.md),
> [Tokens Reference](./tokens-reference.md),
> [Color Scheme](./color-scheme.md)

本專案的 UI styling 採三層治理模型：

1. **Layer 1: Design Token Layer**
2. **Layer 2: Utility Layer**
3. **Layer 3: Primitive Layer**

目的不是限制 rendering 能力，而是讓 styling 決策可治理、可重複判斷、可被 code review / agent / 未來 lint 與 CI 一致執行。

## Authority Model

- 本文件定義三層模型本體、allowed / forbidden 邊界、decision tree。
- [Design System Workflow](./workflow.md) 負責規定 UI 工作在 phase 2 如何套用這個模型。
- [Client Architecture](../architecture/client.md) 負責規定 code 層面的強制邊界與例外。

如果三者有敘述重疊，以本文件為 styling policy source of truth。

## Layer 1: Design Token Layer

Layer 1 定義所有視覺語彙。任何可命名、可版本化、可治理的視覺屬性，都必須來自 token system。

### Token-Owned Properties

下列屬性屬於 token 治理範圍：

- color
- typography
- spacing
- radius
- shadow
- border
- z-index

### Allowed

- semantic color classes，例如 `bg-surface`、`text-primary`、`border-border`
- token scale utilities，例如 `px-4`、`py-2`、`rounded-md`、`shadow-sm`
- document variables、semantic tokens、shared theme mappings

### Forbidden

- hardcoded visual literals，例如 `#3b82f6`、`12px`、手寫 `box-shadow`
- arbitrary values 直接取代 token，例如 `bg-[#123456]`、`text-[14px]`、`rounded-[13px]`
- 以 inline style / `StyleSheet` 硬編碼 token-owned properties

## Layer 2: Utility Layer

Layer 2 使用 NativeWind / Tailwind utilities 組合 layout 與結構。它不定義新的視覺語彙，只負責組合 Layer 1 tokens 與 layout primitives。

### Utility-Owned Concerns

- display
- flex / grid
- alignment
- overflow
- position
- sizing and geometry used purely for layout composition

### Allowed

- `flex`、`grid`、`items-center`、`justify-between`
- `overflow-x-auto`、`relative`、`absolute`
- 使用 token scale 的 spacing utilities 來組合 layout，例如 `gap-2`、`px-4`
- layout 尺寸 utilities，例如 `w-full`、`max-w-[420px]`，前提是它們不是在偷渡視覺語彙

### Forbidden

- 用 Layer 2 utilities 重新發明視覺 token 命名
- 用 arbitrary values 取代 token-owned properties
- 在 route / feature 內用 ad hoc utility 組合出未治理的 shared visual pattern

## Layer 3: Primitive Layer

當 Layer 1 + Layer 2 無法表達某些 runtime rendering 行為時，才可進入 Layer 3。

Layer 3 是受控例外層，用來封裝 rendering primitive，而不是拿來繞過 token system。

### Rendering Primitive Definition

只有在滿足以下條件時，才可視為 primitive：

1. 問題本質是 rendering / runtime behavior，而不是視覺語彙命名。
2. NativeWind / Tailwind 無法穩定或靜態表達。
3. 需求不適合擴充為新 token。

### Allowed By Exception

- `maskImage`
- `WebkitMaskImage`
- `clipPath`
- `transform`
- runtime geometry / rendering needs，例如 scroll fade、complex clipping、platform-specific render workaround

### Forbidden

Primitive component 不得承載 Layer 1 的責任，不得用 inline style / `StyleSheet` 自行定義：

- `color`
- `backgroundColor`
- `fontSize`
- `padding`
- `margin`
- `shadow*`
- `borderRadius`
- token-owned border styling

## Primitive Delivery Requirements

新增 primitive 時，至少要交付以下內容：

1. **Component**
   - 優先放在 `apps/client/src/ui/primitives/**`
   - 若當前 repo 尚未建立完整 `src/ui/primitives/` surface，必須至少放在共享 UI 層並明確標記為 primitive，不可直接散落在 route / feature
2. **Spec**
   - 說明為何 Layer 1 + 2 不足
   - 說明 runtime state / rendering behavior
   - 說明 API props 與平台相容性
3. **Test / Story**
   - 至少一個：snapshot、visual test、story、或等價的 component-level verification

## Decision Flow

任何 UI styling 需求都必須先跑以下決策順序：

```text
需求
 ↓
能否用 Token + Utility 表達？
 ↓ yes
Layer 1 + Layer 2
 ↓ no
是否屬於 rendering primitive？
 ↓ yes
Layer 3（建立 Primitive）
 ↓ no
擴充 Token System / shared DS
```

### Operational Rule

- 能用 token + utility 解決時，不得直接進 Layer 3。
- 若需求是新的視覺語彙，應擴充 token / shared component，而不是建立 primitive。
- 若需求是 runtime rendering 行為，應建立 primitive，而不是在 feature code 中就地寫例外 style。

## Examples

### Standard UI

```tsx
<View className="rounded-md bg-primary px-4 py-2" />
```

分類：Layer 1 + Layer 2

### Scroll Edge Fade

```tsx
<AppHorizontalScrollArea>{children}</AppHorizontalScrollArea>
```

分類：Layer 3。原因是 edge fade 依賴 scroll runtime 與 `maskImage`，不屬於 token 命名問題。

## Machine-Checkable Heuristics

這一段是給未來 lint / CI / agent rule 使用的判斷基礎。

### Flag As Violation

- route / feature 檔案中直接出現視覺性 inline style literal
- `bg-[#...]`、`text-[...]`、`rounded-[...]`、`shadow-[...]` 這類以 arbitrary value 取代 token 的寫法
- shared UI 以外的位置出現未封裝的 rendering primitive style
- primitive component 內硬編碼 token-owned properties

### Usually Allowed

- `className` 中的 layout utilities
- 用 token scale 表達的 spacing / radius / shadow utility
- 共享 primitive 內少量 rendering-specific inline style
- layout-only sizing utilities，即使使用 arbitrary values，只要不是在偷渡視覺語彙

### Needs Human Review

- 看似 layout，但同時影響 visual semantics 的尺寸與位置規則
- 平台差異 workaround
- 因 React Native / web interop 需要的 `StyleSheet`

## Recommended UI Structure

建議共享 UI 逐步收斂為：

```text
apps/client/src/ui/
  components/
  primitives/
  theme/
```

`components/` 是 Layer 1 + 2 的主要消費面，`primitives/` 是 Layer 3 的受控例外面。
本文件不要求同一變更中完成目錄遷移，但所有新規則都應朝這個結構收斂。
