# Pen 補完：新增 Card、Input、Stack 元件

> **前置條件：** Pencil 已開啟並連線（Cursor 需能呼叫 Pencil MCP）。  
> **檔案：** `pencil/app/app-core-screens.pen`

---

## Step 1：取得 DS Components 區的 parent ID

執行 Pencil MCP `batch_get`：

```json
{
  "filePath": "pencil/app/app-core-screens.pen",
  "patterns": [{"reusable": true}],
  "searchDepth": 4,
  "readDepth": 1
}
```

從回傳的節點中，找到任一現有 component（如 `ogBSt` Field）的 **parent**，即 DS Components 區的 frame ID。記下為 `DS_PARENT_ID`。

若無法直接取得 parent，可改為讀取 document 根節點：

```json
{
  "filePath": "pencil/app/app-core-screens.pen",
  "nodeIds": [],
  "readDepth": 2
}
```

找到包含 `spec`、`Components` 或 `DS` 的 frame，其 ID 即 `DS_PARENT_ID`。

---

## Step 2：一次新增 Card、Input、Stack

執行 Pencil MCP `batch_design`（將 `DS_PARENT_ID` 替換為 Step 1 取得的實際 ID）：

```json
{
  "filePath": "pencil/app/app-core-screens.pen",
  "operations": "cardComp=I(\"DS_PARENT_ID\", {type: \"frame\", name: \"component/Card\", reusable: true, layout: \"vertical\", width: 320, height: 120, cornerRadius: 8, fill: \"#FFFFFF\", stroke: \"#CBD5E1\", padding: 16})\ninputComp=I(\"DS_PARENT_ID\", {type: \"frame\", name: \"component/Input\", reusable: true, layout: \"horizontal\", width: 280, height: 48, cornerRadius: 8, fill: \"#FFFFFF\", stroke: \"#CBD5E1\", padding: 16})\nstackComp=I(\"DS_PARENT_ID\", {type: \"frame\", name: \"component/Stack\", reusable: true, placeholder: true, layout: \"vertical\", gap: 16, width: 200, height: 100})"
}
```

回傳會包含 `cardComp`、`inputComp`、`stackComp` 的 node ID。

---

## Step 3：更新 mapping 與 plan

1. 編輯 `docs/design-system/pen-code-component-mapping.md`，將 Card、Input、Stack 的「待補」改為 Step 2 回傳的 Pen ID。
2. 編輯 `docs/plans/2026-02-27-pen-component-code-mapping-plan.md`，更新 Canonical Pen Reusable Components 的 ID。
