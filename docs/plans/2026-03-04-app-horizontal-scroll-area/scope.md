# Scope: AppHorizontalScrollArea

## 問題
目前橫向 tag 列（TagFilters、CreateTodoModal、TagFormModal、TodoItem）直接使用裸 `ScrollView horizontal`，在 web 上：
1. 滑鼠拖拽無法觸發捲動（click-drag ≠ touch scroll）
2. 沒有邊緣 fade 提示，使用者不知道有更多內容

沒有共用 primitive，各處自行重複相同的 props 組合。

## 目標
建立 `AppHorizontalScrollArea` UI primitive，解決 web 可發現性問題，並統一所有橫向捲動列的實作。

## 範圍

### 包含
- 新元件 `apps/client/src/ui/components/AppHorizontalScrollArea.tsx`
- 安裝 `react-native-gesture-handler`（用於 web mouse drag 支援）
- 左右邊緣 fade 遮罩（`pointerEvents="none"` 絕對定位，根據 scrollX 條件顯示）
- 替換現有 4 個使用方：
  - `TagFilters.tsx`
  - `CreateTodoModal.tsx`
  - `TagFormModal.tsx`（emoji picker + color picker 兩處）
  - `TodoItem.tsx`
- 更新 `ui/components/index.ts` export
- 更新 `docs/design-system/pen-code-component-mapping.md`（補 Code 欄位）
- 單元測試 `AppHorizontalScrollArea.test.tsx`

### 不包含
- Snap / paging 行為
- iOS/Android 原生 fade（原生 scroll indicator 已足夠）
- Playwright drag mouse E2E（不穩定，跳過）
- Detox mobile（原生行為不變）

## API

```tsx
interface AppHorizontalScrollAreaProps {
  children: React.ReactNode
  gap?: number                        // contentContainerStyle gap，預設 8
  className?: string                  // 套在外層容器
  contentStyle?: StyleProp<ViewStyle>
}
```

## 依賴決策
使用 `react-native-gesture-handler`（`expo install` 確保版本相容 Expo 54 / RN 0.81）。
以 RNGH 的 `ScrollView` 取代 RN 原生 `ScrollView`，再搭配 `Pan` 手勢補強 web mouse drag。

## 測試策略
- 單元：children 渲染、gap prop、`showsHorizontalScrollIndicator={false}`
- E2E：TagFilters smoke（確認 chip 可見、wheel scroll 有反應）
- 不測 pixel-precise drag

## Pen 對應
`component/HorizontalScrollRow`（Pen ID: A0Bim，contentSlot: FTqx8）已存在於 pen-code-component-mapping.md，本 feature 補齊 Code 欄位。

## 成功標準
1. Web 上可滑鼠拖拽橫向捲動
2. 有更多內容時顯示邊緣 fade
3. 4 個使用方全部改用新元件，無裸 `ScrollView horizontal`
4. 單元測試通過
