# Todo Tags — UI Design (Phase 2)

**Feature:** todo-tags  
**Pen file:** `pencil/app/app-core-screens.pen`

---

## 設計摘要

- **兩排篩選**：Todos 畫面上方維持「全部 / 進行中 / 已完成」；其下新增第二排「依 tag 篩選」（「全部」+ 使用者 tag chip），兩者同時生效。
- **Create/Edit Modal**：在 Due date 與按鈕列之間新增「Tags」區塊 — SectionLabel「Tags」+ 多選 tag chip +「**+ Add tag**」。「+ Add tag」**不跳整頁**：點擊後在 modal 內就地展開輸入框或小 overlay，輸入新 tag 名稱並建立，新 tag 即出現在同列可選，不離開 modal。
- **管理標籤**：Options 畫面新增「Manage tags」連結；點擊以 **modal/sheet** 開啟 **Manage Tags Modal**（與 Create Todo Modal 同款呈現方式），列出所有 tag，每筆可「Rename」「Delete」。與 modal 內「+ Add tag」為不同入口、不同用途。
- **TodoItem**：在 title / due 下方新增一列顯示該 todo 的 tag（設計上用文字示意，實作可用 chip 或同款樣式）。

---

## Pen 節點對應

| 區域 | Pen 節點 | 說明 |
|------|----------|------|
| Todos 畫面 | u57V2 | 主畫面 frame |
| **Todos header** | **PHyUn (header3)** | 左：標題「Todos」(qwYYO)；右：**headerActionsRow (nOBM2)** 內含 Create 按鈕 (Clfoz) + **Options 連結 (byPww)**；與 code `TodosScreenHeader` 一致。 |
| 第一排篩選 | ENXm3 (filters) | 小標「Status」(vq6gY) + 全部 / Active / Done（矩形 FilterChip） |
| **第二排 tag 篩選** | **czbJE (tagFiltersScrollRow)** | 小標「Tags」(O7oEL) + 「All」+ TagBadge；**需橫向捲動**（見下方「Tag 列橫向捲動」）。 |
| 列表 | ZvVlA (listWrap) | TodoItem refs |
| Create Todo Modal | Aa59O | 建立/編輯 sheet |
| **Tags 區塊** | **mogtM (tagsHeaderRow)** + **sVg67 (addTagInline)** + **mgt40 (tagsPickerScrollRow)** | **同一行**左「Tags」、右「+ Add tag」(tagsHeaderRow)。展開時 **addTagInline** 插在標題與 badge 列之間：**單行**左輸入、右 [Add]。**新增 tag 成功後 addTagInline 自動收起**（回到僅顯示「Tags」+「+ Add tag」與 badge 列）。下方為 tag badge 列(mgt40)，可橫向捲動。 |
| **Modal 捲動** | **qbeyO (modalWrap)** | **實作時 modal 內容須可縱向捲動**：inline 展開後 Save/Cancel 在內容底部，使用者捲動即可觸及；不應裁切。Description (ArTNC) 高度已設 96px 以利一屏內多一點內容，必要時仍依 scroll 顯示完整表單。 |
| Options | O4CjV | 設定/選項畫面 |
| **Manage tags 連結** | **3MWNY** (manageTagsLink) | 在 contentWrap 6gHm2 內 |
| **Manage Tags Modal** | **CSLAp (Manage Tags Modal)** | **以 modal/sheet 呈現**（SheetHandle + 內容，height 520）；標題「Manage tags」+ tagList (zseJY)，每行 tagRow 為 **TagBadge** + Rename + Delete（與他處 tag 樣式統一）。 |
| TodoItem 元件 | bEjH4 | 可重用元件 |
| **tagsRow** | **yHt9x** (在 1jVFy 內) | **TagBadge** refs；若 tag 多建議**橫向捲動**（見下方）。 |

---

## Tag 列橫向捲動 + DS 元件

- **有 tag 的區塊**都應考慮**左右滑動**：tag 數量多時可橫向捲動選擇。
- **Pen DS 元件：** **component/HorizontalScrollRow (A0Bim)** — 橫向捲動列容器，內有 contentSlot (FTqx8)；用於辨識「此區在 Code 包 ScrollView horizontal」。可作為 tag 篩選列、tag 多選列、TodoItem 內 tag 列的佈局參考或 ref 父層。
- **對應 frame 名稱：** czbJE `tagFiltersScrollRow`、mgt40 `tagsPickerScrollRow`；yHt9x（TodoItem tagsRow）視需要橫向捲動。
- **Code：** 以上列 frame 的內容包在 **ScrollView horizontal** 內；或使用對應 HorizontalScrollRow 元件（內層即 ScrollView horizontal）。

---

## 可重用元件（沿用）

- **FilterChip / FilterChipActive** (uSf0r, edQQ4) → AppFilterChip：**僅用於狀態篩選**（矩形、36px）。
- **TagChip / TagChipActive** (UFaeP, Fm4sf) → 待實作 AppTagChip：**tag 篩選**（pill、32px）、Modal 內 tag 多選。
- **TagBadge** (X5rfy) → 待實作 AppTagBadge：**todo 上的 tag 顯示**（小 pill、24px、僅顯示）。
- **SectionLabel** (Z7k3d)：區塊「Status」「Tags」；LinkAction、Primary/OutlineButton：Modal、Manage Tags。

---

## 樣式方案：狀態篩選 vs Tag 區分 + Todo 上的 Badge

**問題：** 目前 tag 與狀態篩選都用同一款 FilterChip，視覺難以區分；且 todo 上僅以純文字顯示 tag，辨識度不足。

**參考：** UI/UX Pro Max（hierarchy、touch target、semantic color）、Pencil design-system（radius-pill for badges、section labels）。

### 方案 A — 區塊標題 + 形狀區分（建議）

| 區域 | 視覺 |
|------|------|
| **第一排** | 上方加小標「狀態」（SectionLabel 風格）；維持現有 **矩形** chip（FilterChip / FilterChipActive），36px 高。 |
| **第二排** | 上方加小標「標籤」；改用 **pill**（cornerRadius 20 或 999）、高度 28–32px、**TagChip**：透明底 + 邊框；**TagChipActive**：primary 填滿。與狀態排「矩形 vs 膠囊」一眼可辨。 |
| **Todo 上的 tag** | **TagBadge**：小 pill（約 24px 高、cornerRadius 12）、淺底（primarySoft / surface）+ 邊框、字 12px muted；僅顯示用、不當按鈕。每個 todo 下方一排小 badge 標示綁定的 tag。 |

- **優點：** 形狀 + 標題雙重區分，實作單純（僅新增 TagBadge、TagChip 兩款元件）。
- **實作：** Pen 新增 component/TagBadge、component/TagChip、component/TagChipActive；狀態排前插 SectionLabel「狀態」、tag 排前插「標籤」；TodoItem 的 tagsRow 改為 TagBadge refs。

### 方案 B — 顏色區分

- 狀態：維持 primary（teal）矩形。
- 標籤篩選與 todo badge：改用 **中性/次要** — 未選 outline（border + 透明），選中用 primarySoft 底 + primary 字；badge 一律 primarySoft 底。用「色相」區分「主動作（狀態）」與「標籤（輔助）」。
- **優點：** 不改形狀也能區分。**缺點：** 若 primarySoft 與 primary 對比不足，仍可能混淆。

### 方案 C — 尺寸 + 圖示

- 狀態：維持 36px 矩形。
- 標籤排：28px 高、pill，左側加小 icon（如 tag/label）讓「這是 tag」語意明確。
- Todo badge：僅小 pill 文字、無 icon。
- **優點：** 圖示強化語意。**缺點：** 需維護 icon、多一種視覺元素。

**建議採用方案 A**，並在 Pen 與 code 實作（TagBadge、TagChip/TagChipActive、區塊標題、TodoItem 用 TagBadge）。

---

## 變數與樣式（更新）

- **狀態篩選**：沿用 FilterChip / FilterChipActive（矩形、36px、primary）。
- **Tag 篩選**：TagChip / TagChipActive（pill、28–32px）；可沿用 `$primary`、`$border`、`$surface`；必要時加 `$primarySoft`（#CCFBF1）給 TagBadge 與 TagChip 未選態。
- **TagBadge**：`$primarySoft` 或 `$surface` 底、`$border` 邊框、`$textMuted` 字、pill 圓角。

- 沿用既有 semantic variables（`$background`, `$surface`, `$text`, `$textMuted`, `$primary`, `$border` 等）。
- Tag 篩選列與第一排篩選同 padding [12, 20]、gap 8、height 48，視覺一致。

---

## Phase 3 使用方式

- 實作計畫可依 **scope.md** + 本表節點 ID 對應到檔案與元件。
- 新增路由 **(app)/manage-tags.tsx** 對應 Pen 畫面 **Manage Tags (CSLAp)**；Options 連結導向此路由。
