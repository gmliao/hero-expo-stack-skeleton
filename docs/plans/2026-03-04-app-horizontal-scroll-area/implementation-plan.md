# AppHorizontalScrollArea Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 建立 `AppHorizontalScrollArea` UI primitive，讓 tag 橫向列在 web 上支援滑鼠拖拽捲動與邊緣 fade 提示，並替換現有 4 個裸 `ScrollView horizontal` 使用方。

**Architecture:** 安裝 `react-native-gesture-handler`，以其 `ScrollView` 取代 RN 原生 `ScrollView`，web 平台額外包一層 `GestureDetector` + `Pan` 手勢攔截滑鼠拖拽。Edge fade 以 `position: absolute` 的漸層 View 實作（web-only，`backgroundImage` inline style）。

**Tech Stack:** React Native + NativeWind / react-native-gesture-handler v2 + react-native-reanimated（已裝）+ Jest + RNTL

---

## Task 1：安裝 react-native-gesture-handler

**Files:**
- Modify: `apps/client/package.json`（自動更新）
- Modify: `apps/client/jest.config.js`（transformIgnorePatterns）
- Modify: `apps/client/jest.setup.ts`（加 RNGH jest mock）
- Verify: `apps/client/app/_layout.tsx`（確認不需要手動加 GestureHandlerRootView）

**Step 1: 安裝套件**

```bash
cd apps/client
bunx expo install react-native-gesture-handler
```

Expected: package.json 出現 `"react-native-gesture-handler": "~X.X.X"`（版本由 expo 決定，與 SDK 54 / RN 0.81 相容）

**Step 2: 更新 jest.config.js transformIgnorePatterns**

在 `apps/client/jest.config.js` 找到這行：
```js
'node_modules/(?!(jest-)?react-native|@react-native|expo|@expo|@unimodules|nativewind|@gluestack-ui|@gluestack-style)',
```
改為（加入 `react-native-gesture-handler`）：
```js
'node_modules/(?!(jest-)?react-native|@react-native|expo|@expo|@unimodules|nativewind|@gluestack-ui|@gluestack-style|react-native-gesture-handler)',
```

**Step 3: 在 jest.setup.ts 加入 RNGH jest mock**

在 `apps/client/jest.setup.ts` 頂部加入：
```ts
import 'react-native-gesture-handler/jestSetup'
```

**Step 4: 確認 GestureHandlerRootView**

Expo Router v4+（expo-router ~6.0.x）在 root layout 自動提供 `GestureHandlerRootView`，**不需手動加**。確認 `app/_layout.tsx` 沒有自行包一個 `GestureHandlerRootView` 就不用動。

**Step 5: 跑既有測試確認沒有因設定改動而壞掉**

```bash
cd apps/client
bun test --passWithNoTests 2>&1 | tail -20
```

Expected: 所有既有測試仍 PASS（或與 RNGH 無關的 test suite 全 pass）

**Step 6: Commit**

```bash
git add apps/client/package.json apps/client/bun.lock apps/client/jest.config.js apps/client/jest.setup.ts
git commit -m "chore(deps): install react-native-gesture-handler, update jest config"
```

---

## Task 2：建立 AppHorizontalScrollArea 元件

**Files:**
- Create: `apps/client/src/ui/components/AppHorizontalScrollArea.tsx`
- Modify: `apps/client/src/ui/components/index.ts`

**Step 1: 寫測試（失敗先行）**

建立 `apps/client/tests/ui/components/AppHorizontalScrollArea.test.tsx`：

```tsx
import { render, screen } from '@testing-library/react-native'
import { Text } from 'react-native'
import { AppHorizontalScrollArea } from '@/ui/components/AppHorizontalScrollArea'

describe('AppHorizontalScrollArea', () => {
  it('renders children', () => {
    render(
      <AppHorizontalScrollArea>
        <Text testID="child">Tag</Text>
      </AppHorizontalScrollArea>,
    )
    expect(screen.getByTestId('child')).toBeOnTheScreen()
  })

  it('passes gap to contentContainerStyle', () => {
    render(
      <AppHorizontalScrollArea gap={12}>
        <Text>Tag</Text>
      </AppHorizontalScrollArea>,
    )
    // ScrollView from RNGH renders correctly without error
    expect(screen.getByText('Tag')).toBeOnTheScreen()
  })

  it('hides horizontal scroll indicator by default', () => {
    const { UNSAFE_getByType } = render(
      <AppHorizontalScrollArea>
        <Text>Tag</Text>
      </AppHorizontalScrollArea>,
    )
    // ScrollView from react-native-gesture-handler
    const { ScrollView } = require('react-native-gesture-handler')
    const scrollView = UNSAFE_getByType(ScrollView)
    expect(scrollView.props.showsHorizontalScrollIndicator).toBe(false)
  })
})
```

**Step 2: 執行測試，確認 FAIL**

```bash
cd apps/client
bun test tests/ui/components/AppHorizontalScrollArea.test.tsx
```

Expected: FAIL — `Cannot find module '@/ui/components/AppHorizontalScrollArea'`

**Step 3: 建立元件**

建立 `apps/client/src/ui/components/AppHorizontalScrollArea.tsx`：

```tsx
import { useRef, useState } from 'react'
import { Platform, View, type StyleProp, type ViewStyle } from 'react-native'
import { Gesture, GestureDetector, ScrollView } from 'react-native-gesture-handler'
import { cn } from '@/ui/utils/cn'

interface AppHorizontalScrollAreaProps {
  children: React.ReactNode
  gap?: number
  className?: string
  contentStyle?: StyleProp<ViewStyle>
}

export function AppHorizontalScrollArea({
  children,
  gap = 8,
  className,
  contentStyle,
}: AppHorizontalScrollAreaProps) {
  const scrollRef = useRef<ScrollView>(null)
  const scrollXRef = useRef(0)
  const startScrollXRef = useRef(0)
  const containerWidthRef = useRef(0)
  const [showLeftFade, setShowLeftFade] = useState(false)
  const [showRightFade, setShowRightFade] = useState(false)

  const isWeb = Platform.OS === 'web'

  const pan = Gesture.Pan()
    .runOnJS(true)
    .activeOffsetX([-4, 4])
    .failOffsetY([-8, 8])
    .onBegin(() => {
      startScrollXRef.current = scrollXRef.current
    })
    .onUpdate(e => {
      const newX = Math.max(0, startScrollXRef.current - e.translationX)
      scrollRef.current?.scrollTo({ x: newX, animated: false })
    })

  function handleScroll(e: {
    nativeEvent: {
      contentOffset: { x: number }
      contentSize: { width: number }
      layoutMeasurement: { width: number }
    }
  }) {
    const x = e.nativeEvent.contentOffset.x
    const contentWidth = e.nativeEvent.contentSize.width
    const viewWidth = e.nativeEvent.layoutMeasurement.width
    scrollXRef.current = x
    containerWidthRef.current = viewWidth
    setShowLeftFade(x > 4)
    setShowRightFade(x < contentWidth - viewWidth - 4)
  }

  function handleContentSizeChange(contentWidth: number) {
    setShowRightFade(contentWidth > containerWidthRef.current + 4)
  }

  const scrollView = (
    <ScrollView
      ref={scrollRef}
      horizontal
      showsHorizontalScrollIndicator={false}
      onScroll={isWeb ? handleScroll : undefined}
      onContentSizeChange={isWeb ? handleContentSizeChange : undefined}
      scrollEventThrottle={16}
      contentContainerStyle={[{ gap }, contentStyle as StyleProp<ViewStyle>]}
    >
      {children}
    </ScrollView>
  )

  if (!isWeb) {
    return <View className={cn('flex-1', className)}>{scrollView}</View>
  }

  return (
    <View className={cn('flex-1', className)} style={{ position: 'relative' }}>
      <GestureDetector gesture={pan}>{scrollView}</GestureDetector>
      {showLeftFade && (
        <View
          pointerEvents="none"
          style={[
            { position: 'absolute', left: 0, top: 0, bottom: 0, width: 24 },
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            { backgroundImage: 'linear-gradient(to right, rgba(255,255,255,0.95), transparent)' } as any,
          ]}
        />
      )}
      {showRightFade && (
        <View
          pointerEvents="none"
          style={[
            { position: 'absolute', right: 0, top: 0, bottom: 0, width: 24 },
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            { backgroundImage: 'linear-gradient(to left, rgba(255,255,255,0.95), transparent)' } as any,
          ]}
        />
      )}
    </View>
  )
}
```

**Step 4: 執行測試，確認 PASS**

```bash
cd apps/client
bun test tests/ui/components/AppHorizontalScrollArea.test.tsx
```

Expected: 3 tests PASS

**Step 5: Export 元件**

在 `apps/client/src/ui/components/index.ts` 加入：
```ts
export { AppHorizontalScrollArea } from './AppHorizontalScrollArea'
```

（按字母順序插在 `AppFilterChip` 之後、`AppInput` 之前）

**Step 6: Commit**

```bash
git add apps/client/src/ui/components/AppHorizontalScrollArea.tsx \
        apps/client/src/ui/components/index.ts \
        apps/client/tests/ui/components/AppHorizontalScrollArea.test.tsx
git commit -m "feat(ui): add AppHorizontalScrollArea primitive with drag-to-scroll and edge fades"
```

---

## Task 3：替換 TagFilters

**Files:**
- Modify: `apps/client/src/features/todos/TagFilters.tsx`

**Step 1: 替換**

在 `TagFilters.tsx`，移除 `import { ScrollView, View }` 中的 `ScrollView`，改成：
```tsx
import { ScrollView, View } from 'react-native'
// ↓ 移除 ScrollView，保留 View
import { View } from 'react-native'
```
並加入：
```tsx
import { AppHorizontalScrollArea } from '@/ui/components'
```

將目前的：
```tsx
<ScrollView
  horizontal
  showsHorizontalScrollIndicator={false}
  contentContainerStyle={{ gap: 8 }}
  className="flex-1 flex-row items-center"
>
  ...chips
</ScrollView>
```

替換為：
```tsx
<AppHorizontalScrollArea gap={8} className="flex-row items-center">
  ...chips
</AppHorizontalScrollArea>
```

**Step 2: 執行既有 TagFilters 測試**

```bash
cd apps/client
bun test tests/features/todos/TagFilters.test.tsx
```

Expected: PASS

**Step 3: Commit**

```bash
git add apps/client/src/features/todos/TagFilters.tsx
git commit -m "refactor(TagFilters): replace ScrollView horizontal with AppHorizontalScrollArea"
```

---

## Task 4：替換 CreateTodoModal

**Files:**
- Modify: `apps/client/src/features/todos/CreateTodoModal.tsx`

**Step 1: 替換**

在 `CreateTodoModal.tsx`，從 `react-native` 的 import 移除 `ScrollView`（保留 `Modal`, `Pressable`, `View`）。

加入：
```tsx
import { AppHorizontalScrollArea } from '@/ui/components'
```

找到 tag picker 的 `ScrollView`（約第 288 行）：
```tsx
<ScrollView
  horizontal
  showsHorizontalScrollIndicator={false}
  contentContainerStyle={{ gap: 8 }}
  className="flex-row items-center"
>
  ...tags
</ScrollView>
```

替換為：
```tsx
<AppHorizontalScrollArea gap={8} className="flex-row items-center">
  ...tags
</AppHorizontalScrollArea>
```

注意：外層還有一個 `ScrollView`（垂直，`keyboardShouldPersistTaps="handled"`），**不要動那個**。

**Step 2: 執行相關測試**

```bash
cd apps/client
bun test tests/features/todos/ 2>&1 | tail -30
```

Expected: PASS

**Step 3: Commit**

```bash
git add apps/client/src/features/todos/CreateTodoModal.tsx
git commit -m "refactor(CreateTodoModal): replace tag picker ScrollView with AppHorizontalScrollArea"
```

---

## Task 5：替換 TagFormModal

**Files:**
- Modify: `apps/client/src/features/todos/TagFormModal.tsx`

**Step 1: 替換兩處**

在 `TagFormModal.tsx`，從 react-native import 移除 `ScrollView`。

加入：
```tsx
import { AppHorizontalScrollArea } from '@/ui/components'
```

**第一處**（emoji picker，約第 124 行）：
```tsx
<ScrollView
  horizontal
  showsHorizontalScrollIndicator={false}
  contentContainerStyle={{ gap: 8 }}
>
  {EMOJI_OPTIONS.map(...)}
</ScrollView>
```
→
```tsx
<AppHorizontalScrollArea gap={8}>
  {EMOJI_OPTIONS.map(...)}
</AppHorizontalScrollArea>
```

**第二處**（color picker，約第 145 行）：
```tsx
<ScrollView
  horizontal
  showsHorizontalScrollIndicator={false}
  contentContainerStyle={{ gap: 8 }}
>
  {COLOR_OPTIONS.map(...)}
</ScrollView>
```
→
```tsx
<AppHorizontalScrollArea gap={8}>
  {COLOR_OPTIONS.map(...)}
</AppHorizontalScrollArea>
```

**Step 2: 執行相關測試**

```bash
cd apps/client
bun test tests/features/todos/TagFormModal.test.tsx
```

Expected: PASS

**Step 3: Commit**

```bash
git add apps/client/src/features/todos/TagFormModal.tsx
git commit -m "refactor(TagFormModal): replace emoji and color picker ScrollViews with AppHorizontalScrollArea"
```

---

## Task 6：替換 TodoItem

**Files:**
- Modify: `apps/client/src/features/todos/TodoItem.tsx`

**Step 1: 替換**

在 `TodoItem.tsx`，從 react-native import 移除 `ScrollView`（保留 `Pressable`, `View`）。

加入：
```tsx
import { AppHorizontalScrollArea } from '@/ui/components'
```

找到 tag badge 列（約第 91 行）：
```tsx
<ScrollView
  horizontal
  showsHorizontalScrollIndicator={false}
  contentContainerStyle={{ gap: 6 }}
  className="-mx-0.5"
>
  {todo.tagIds.map(...)}
</ScrollView>
```
→
```tsx
<AppHorizontalScrollArea gap={6} className="-mx-0.5">
  {todo.tagIds.map(...)}
</AppHorizontalScrollArea>
```

**Step 2: 執行相關測試**

```bash
cd apps/client
bun test 2>&1 | tail -30
```

Expected: 全部 PASS

**Step 3: Commit**

```bash
git add apps/client/src/features/todos/TodoItem.tsx
git commit -m "refactor(TodoItem): replace tag badges ScrollView with AppHorizontalScrollArea"
```

---

## Task 7：更新 Pen-Code 對應文件

**Files:**
- Modify: `docs/design-system/pen-code-component-mapping.md`

**Step 1: 更新 Pen → Code 表**

找到這一行：
```
| **component/HorizontalScrollRow** | **A0Bim** | **橫向捲動列**（Code 包 ScrollView horizontal） | ...
```

更新 Code 欄位：
```
| **component/HorizontalScrollRow** | **A0Bim** | **AppHorizontalScrollArea** | `AppHorizontalScrollArea.tsx`；水平捲動 primitive，web 支援滑鼠拖拽 + 邊緣 fade；gap prop（預設 8）；替換 TagFilters / CreateTodoModal / TagFormModal / TodoItem 的裸 ScrollView horizontal。 |
```

**Step 2: 更新 Code → Pen 表**

找到：
```
| HorizontalScrollRow（橫向捲動列） | 待實作 | component/HorizontalScrollRow | A0Bim |
```

更新為：
```
| AppHorizontalScrollArea | AppHorizontalScrollArea.tsx | component/HorizontalScrollRow | A0Bim |
```

**Step 3: Commit**

```bash
git add docs/design-system/pen-code-component-mapping.md
git commit -m "docs(design-system): update pen-code mapping for AppHorizontalScrollArea"
```

---

## Task 8：更新 status.md 並完成 Phase 3/4

**Files:**
- Modify: `docs/plans/2026-03-04-app-horizontal-scroll-area/status.md`

**Step 1: 更新 status.md**

```markdown
# Feature: app-horizontal-scroll-area

**Current phase:** 5 (in progress)

## Handoff log

| From → To | Completed (date) | Handoff content |
|-----------|------------------|-----------------|
| 1 → 3    | 2026-03-04       | [scope.md](scope.md)：需求、API 設計、依賴決策。Phase 2 N/A（Pen A0Bim 已存在）。 |
| 3/4 → 5  | 2026-03-04       | [implementation-plan.md](implementation-plan.md)：8 tasks，TDD，逐步替換。 |
```

**Step 2: Commit**

```bash
git add docs/plans/2026-03-04-app-horizontal-scroll-area/
git commit -m "docs(app-horizontal-scroll-area): Phase 3/4 complete, implementation plan written"
```

---

## 驗證 Checklist（Phase 5 完成後執行）

```bash
# 1. 全部單元測試通過
cd apps/client && bun test

# 2. TypeScript 編譯無錯誤
bun run type-check

# 3. Web build 無錯誤
bun run build:web 2>&1 | tail -20

# 4. 確認沒有遺漏的裸 ScrollView horizontal（只應看到 CreateTodoModal 的垂直 ScrollView）
grep -rn "ScrollView" apps/client/src --include="*.tsx" | grep -v "node_modules" | grep -v "Vertical\|vertical\|keyboardShouldPersist"
```
