# Todo Tag Interactions — UI Design (Phase 2)

**Feature:** todo-tag-interactions  
**Pen file:** `pencil/app/app-core-screens.pen`

> **Note:** This phase was re-run with Pencil MCP on 2026-03-04. The checked-in `.pen` file is now updated with the tag palette variables and a `Create Tag Modal` prototype (`5C8Lv`).

---

## 設計摘要

- **Todo item tag badge 改為可互動篩選入口**：點 badge 等於點上方 tag filter row 的同一個 tag；若該 tag 已經是 active，再點一次回到 `All`。
- **Create/Edit Todo modal 只負責選 tag**：主畫面不再把「建立 tag」內嵌在 tag picker 主流內；改成 `New tag` / `Create first tag` 開啟一個輕量 child modal。
- **新增 tag 與編輯 tag 分流**：
  - **快速新增**：在 todo flow 內開 `Create Tag` child modal，建立成功後自動選取新 tag。
  - **完整編輯**：在 `Manage Tags` 內進行，負責名稱、emoji、color token、刪除。
- **Tag 視覺升級為正式 DS 語彙**：每個 tag 具有 `emoji + label + colorToken`，顏色只能從系統定義的 tag token palette 中選。

---

## 互動模型

### 1. Todo list badge ↔ tag filter row 連動

- 共享同一個 `selectedTagId`。
- 點 todo item 內 badge：
  - 若目前 `selectedTagId !== tag.id`，則切換為該 tag
  - 若目前 `selectedTagId === tag.id`，則清回 `null`（`All`）
- 上方 tag filter row 立即反映 active 狀態。
- 篩選後清單只保留含該 tag 的 todos。

### 2. Create/Edit Todo modal

- `Tags` 區只顯示：
  - 既有 tag chips（可多選）
  - `New tag` action
- 若 `tags.length === 0`：
  - 不顯示空白 chip row
  - 改顯示 empty state 文案 + `Create first tag`
- 成功建立 tag 後：
  - child modal 關閉
  - tag list 重新可用
  - 新 tag 自動加入 `selectedTagIds`

### 3. Manage Tags

- 保持為 tag 的完整管理入口。
- 從 Options 的 `Manage tags` 進入。
- 每列顯示 tag preview。
- 每列以 `Edit` / `Delete` 為主，不再只做 rename。
- `Edit tag` modal 內可編輯：
  - `name`
  - `emoji`
  - `colorToken`

---

## Pen 節點對應與變更

| 區域 | 現有 Pen 節點 | Phase 2 定稿 |
|------|---------------|--------------|
| Todos screen | `u57V2` | 保持主畫面結構不變。 |
| Tag filter row | `czbJE` | 保留作為 tag filter row；由單純靜態示意改為與 todo badge 同步的 active/inactive filter。 |
| Create/Edit Todo modal | `Aa59O` | 保持 modal 架構。 |
| Tags header row | `mogtM` | 右側文案從 `+ Add tag` 調整為 `New tag`；角色為開 child modal，而非 inline 展開。 |
| Inline add row | `sVg67` | **不再作為主要方案**；由 `Create Tag` child modal 取代。實作時可移除或保留作歷史參考，但不再是 source of truth。 |
| Tags picker row | `mgt40` | 保留，改為只呈現既有 tags 的選取 chips。 |
| Todo item tags row | `yHt9x` | badge 改為可互動篩選入口；active tag 需有明確選中態。 |
| Manage Tags entry | `3MWNY` | 保留 Options 入口。 |
| Manage Tags modal/screen | `CSLAp` | 從「rename/delete 列表」升級為完整 tag 管理頁，需容納 `Edit tag` / `Delete` 與 `New tag` CTA。 |
| Create Tag child modal | `5C8Lv` | 新增快速建立 tag 的 child modal 原型：名稱、emoji、color token、Cancel / Create tag。 |

---

## Reusable Components / DS 決策

### Surface contract

下列 surface 不是「可選擇是否顯示 metadata」，而是 phase 2 起必須一致顯示：

| Surface | 元件 | 必須顯示 |
|---------|------|----------|
| Todo list tags row | `AppTagBadge` | `emoji + label + colorToken` |
| Create/Edit Todo tags picker | `AppTagChip` | `emoji + label + colorToken` |
| Tag filter row | `AppTagChip` | `emoji + label + colorToken`（`All` 例外） |
| Manage Tags preview | `AppTagBadge` | `emoji + label + colorToken` |
| Tag form preview | `AppTagBadge` | `emoji + label + colorToken` |

如果某個 surface 沒顯示這三者，就代表 DS / Pen / code 映射不完整，不能視為「實作細節」。

### 1. Status chips 與 tag chips 分離

維持原有設計方向：

- `AppFilterChip` / Pen `uSf0r`, `edQQ4`
  - **只用在 status filter**
  - 保持矩形、36px
- Tag 系列元件
  - **只用在 tag**
  - 使用 pill 形狀與 tag palette

### 2. Tag 元件分工

| 用途 | Pen 元件 | Code 元件方向 | 規格 |
|------|----------|----------------|------|
| Todo item 上的 tag badge | `X5rfy`, `ead5P` | `AppTagBadge` 擴充互動與 active state | 24px 高，小型 pill，emoji + label |
| Tag filter row | `UFaeP`, `Fm4sf` | `AppTagChip` | 32px 高，作為明確可點 filter |
| Create/Edit modal picker | `UFaeP`, `Fm4sf` | `AppTagChip` | 32px 高，多選 |
| Manage Tags preview | `X5rfy` | `AppTagBadge` | 顯示目前 tag 樣式預覽 |

### 3. Quick Create Tag child modal

新增一個輕量 child modal，建議在 Pen 中新增對應 reusable modal pattern，而不是把輸入塞回 `sVg67`：

- title: `Create tag`
- fields:
  - name
  - emoji picker / preset emoji list
  - color token selector
- actions:
  - cancel
  - create

同一組 UI 之後也可支援 `Edit tag` modal 共用。

---

## Tag 視覺語言

### 1. Emoji 的角色

- emoji 不是一般 UI icon。
- emoji 是 tag metadata，本身屬於 tag 內容的一部分。
- 顯示位置：
  - todo badge
  - tag filter chip
  - create/edit picker chip
  - manage-tags preview

### 2. Color token palette

顏色只能來自 DS allowlist。建議新增一組 tag semantic palette：

| Token | 用途建議 | Light background | Text | Border |
|-------|----------|------------------|------|--------|
| `tagTeal` | 預設 / 工作流主色 | `#CCFBF1` | `#115E59` | `#5EEAD4` |
| `tagBlue` | 資訊 / 專案 | `#DBEAFE` | `#1D4ED8` | `#93C5FD` |
| `tagGreen` | 生活 / 完成感 | `#DCFCE7` | `#166534` | `#86EFAC` |
| `tagAmber` | 注意 / 等待 | `#FEF3C7` | `#92400E` | `#FCD34D` |
| `tagRose` | 個人 / 高優先 | `#FFE4E6` | `#BE123C` | `#FDA4AF` |

這些不是自由色，而是受系統控管的語意 tag palette。  
實作時可在 `design-tokens.js` / `semantic.ts` 以結構化 token 暴露。

本次已在 Pen variables 新增：

- `tagTealBg` / `tagTealText` / `tagTealBorder`
- `tagBlueBg` / `tagBlueText` / `tagBlueBorder`
- `tagGreenBg` / `tagGreenText` / `tagGreenBorder`
- `tagAmberBg` / `tagAmberText` / `tagAmberBorder`
- `tagRoseBg` / `tagRoseText` / `tagRoseBorder`

### 3. Active 視覺

- **Todo item badge active**：
  - 對應 tag 的 token 色加深或反相
  - 明確可點 affordance，不再像純展示文字
- **Tag filter chip active**：
  - 使用相同 tag token 的 active 版，不再統一只靠 `primary`
- **Selected picker chip**：
  - 保持與 filter 同一語言，但尺寸較大，點擊區更清楚

---

## Screen-Level 設計決策

### Todos screen

- 上方 status row 保持矩形 chips。
- 下方 tag filter row 改為 emoji + label pills。
- Todo item 內的 tagsRow 仍保留，但其交互明確定義為 filter，不是 edit 或 untag。
- 當前篩選中的 tag，在清單內對應 badge 需有 active 狀態。

### Create/Edit Todo modal

- `Tags` 區只做選擇。
- 既有 tag 時：
  - chip row
  - `New tag` action
- 無 tag 時：
  - empty state copy
  - `Create first tag` CTA
- `Create Tag` child modal 成功後直接回到選擇情境。
- 下方 chips 是真正的 display surface，不是 placeholder row：
  - 每個 chip 都要顯示 `emoji + label`
  - 顏色需對應所選 `colorToken`

### Manage Tags

- 頂部建議新增 `New tag` CTA，與空狀態一致。
- 每列以 preview + `Edit` + `Delete` 組成。
- `Edit tag` modal 承接完整編輯，不拆成單純 rename。
- preview badge 不能退化成純文字；它是 tag identity 的 primary preview surface。

---

## 文案方向

建議新增或調整的文案：

- `todos.modal.newTag`
- `todos.modal.createFirstTag`
- `todos.modal.noTagsYet`
- `manageTags.newTag`
- `manageTags.edit`
- `manageTags.editTitle`
- `manageTags.emoji`
- `manageTags.color`
- `manageTags.saveTag`

現有 `+ Add tag` 文案不再作為主方案文案。

---

## 與既有設計文件的差異

本次 phase 2 明確取代 `2026-03-02-todo-tags` 的幾個舊決策：

- `sVg67 addTagInline` 不再是主要新增 tag UX
- `AppTagBadge` 不再是 display-only
- `TagChip / TagChipActive` 不再標記為備用，而是應成為主要 tag selection/filter 元件
- `Manage Tags` 不再只是 rename/delete 列表，而是完整 tag 編輯入口

---

## Phase 3 Handoff

Phase 3 implementation planning should cover:

- shared API contract for `emoji` / `colorToken`
- backend schema + validation allowlist for tag visual metadata
- DS token additions for tag palette
- reusable UI split between `AppTagBadge` and `AppTagChip`
- all tag display surfaces must render metadata, not just the reusable component examples
- todo badge → filter synchronization behavior
- quick create-tag child modal and edit-tag modal reuse
- updated i18n, mapping docs, and Pen sync follow-up
