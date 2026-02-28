# Pencil 整合

> **入口**：[README Pencil 整合](../README.md#pencil-整合)

本專案使用 [Pencil](https://pencil.so) 作為 UI 設計工具，`.pen` 檔案與 Code 元件雙向對應。

---

## 設計檔位置

| 檔案 | 用途 |
|------|------|
| `pencil/app/app-core-screens.pen` | UI 設計稿、DS 元件、畫面與元件規格 |

---

## Pen ↔ Code 對應

- **mapping 表**：[pen-code-component-mapping.md](pen-code-component-mapping.md)（Pen 元件 ↔ `@/ui/components`）
- **顏色 token**：[color-scheme.md](color-scheme.md)（語意色，Pen 與 Code 共用）
- **間距／圓角／z-index／動效／陰影**：[tokens-reference.md](tokens-reference.md)（數值 scale 參考）
- **待補元件規格**：[pen-gap-spec.md](pen-gap-spec.md)（Code 有、Pen 尚缺的元件規格）

---

## 設計系統流程（Pen-first）

1. **先在 Pen 定稿**：版面、變數、可重用元件（`reusable: true`）
2. **規劃**：從 Pen 產出實作計畫（檔案、Pen ID、i18n keys）
3. **實作**：對應 `@/ui/components`、route/feature，更新 mapping 表

新增元件時，Pen 與 Code 必須雙向同步並更新 `pen-code-component-mapping.md`。

---

## Pencil MCP

當 Pencil 已開啟並連線時，Cursor 可透過 **Pencil MCP** 操作 `.pen` 檔案：

- `batch_get`：查詢節點、元件
- `batch_design`：新增/更新/刪除元件
- `get_guidelines`、`get_style_guide`：設計 guideline

**Runbook**：[pen-add-card-input-stack.md](../runbooks/pen-add-card-input-stack.md)（以 MCP 批次新增 Card、Input、Stack 範例）
