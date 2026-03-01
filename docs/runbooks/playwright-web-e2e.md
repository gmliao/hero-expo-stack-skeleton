# Playwright Web E2E Runbook

這份文件是本 repo 的 Playwright Web E2E 通用準則。只要你要修改 `e2e-web/tests/**`、`playwright.config.ts`、`e2e-web/playwright.console.config.ts`，先讀這份。

## Scope

適用於：

- `bun run e2e:web`
- `bun run check:pw:console`
- `e2e-web/tests/**`
- root `playwright.config.ts`
- `e2e-web/playwright.console.config.ts`

不適用於：

- Jest / RNTL 單元測試
- Detox mobile E2E

## Required Baseline

- 一律用 `bun`
- Web E2E 必須跑 emulator，不碰正式環境
- 互動選擇器優先順序：
  1. `getByTestId`
  2. `getByRole`
  3. 穩定的語意 selector
- 避免用會受 i18n 影響的文字斷言作為主要互動入口

## Native Dialog Rules

Web 上若使用原生對話框：

- `window.confirm()`
- `window.alert()`
- `window.prompt()`

必須遵守這些規則。

### Rule 1: 先掛事件，再觸發互動

錯誤寫法：

```ts
await button.click()
const dialog = await page.waitForEvent('dialog')
```

正確寫法：

```ts
const dialogPromise = page.waitForEvent('dialog', { timeout: 5_000 })
const clickPromise = button.click()
const dialog = await dialogPromise
```

原因：

- 原生 dialog 會在互動過程中直接阻塞瀏覽器
- 如果先 `await click()`，Playwright 可能永遠等不到 click 完成
- 這類問題常表現成 `locator.click: Test timeout exceeded`

### Rule 2: dialog handling 要和互動在同一段 async flow 完成

對 `confirm`：

```ts
const dialogPromise = page.waitForEvent('dialog', { timeout: 5_000 })
const clickPromise = button.click()
const dialog = await dialogPromise
expect(dialog.type()).toBe('confirm')
await dialog.accept()
await clickPromise
```

對「先 confirm、後 alert」：

```ts
const confirmPromise = page.waitForEvent('dialog', { timeout: 5_000 })
const clickPromise = button.click()
const confirmDialog = await confirmPromise
expect(confirmDialog.type()).toBe('confirm')

const alertPromise = page.waitForEvent('dialog', { timeout: 5_000 })
await confirmDialog.accept()
await clickPromise

const alertDialog = await alertPromise
expect(alertDialog.type()).toBe('alert')
```

### Rule 3: 重複 dialog flow 必須抽 helper

如果兩個以上測試用到相同的 confirm / alert 時序：

- 抽成 helper
- 不要在每個 test 重新手寫

目的：

- 防止 copy-paste 錯誤
- 降低再次把 `waitForEvent` 放到 `click()` 後面的機率

## Timeout Policy

### Separate timeout types clearly

- `timeout`: 單個 test 的總時限
- `actionTimeout`: click / fill / focus / press 這類互動時限
- `webServer.timeout`: 起 Expo web server 的時限

不要把它們混成同一個概念。

### Required default for stuck interactions

`playwright.config.ts` 的 `use.actionTimeout` 應保持短時限，現在基準是 `5_000`。

理由：

- 如果是 dialog、overlay、disabled state、navigation deadlock 導致互動卡住，5 秒就應該失敗
- 不要讓這類錯誤拖到 60 秒的整體 test timeout 才暴露

### Do not use shorter global test timeout as a root-cause substitute

如果根因是互動卡住：

- 應先修 selector / dialog / wait condition / app state
- 不要只把整體 test timeout 硬降來掩蓋問題

## Error Surfacing Rules

如果測試需要驗證 mutation 失敗：

- Web 端必須能把錯誤變成 Playwright 可觀察事件
- 可以是 browser native dialog
- 或穩定的 DOM error surface

不要接受這種狀況：

- request 失敗，但 UI 沒有可觀察錯誤
- 測試只能靠 timeout 推測失敗

對 API fail path，優先在 Playwright 用 `page.route()` 回傳結構化錯誤：

```ts
await route.fulfill({
  status: 500,
  contentType: 'application/json',
  body: JSON.stringify({ success: false, error: 'INTERNAL', message: 'Internal error' }),
})
```

這要符合 `FailureDto` 契約，不要回傳臨時 shape。

## Selector And Assertion Policy

- 互動入口：`getByTestId()` 或 `getByRole()`
- 可見性：`expect(locator).toBeVisible()`
- 非同步狀態轉換：`expect.poll(...)` 或等待特定 response / URL
- 不要用 `waitForTimeout()` 當主要同步手段

對列表、切換、mutation：

- 先等明確訊號
- 再做畫面斷言

例如：

- 等 `PATCH` response
- 等 modal 關閉
- 等 checkbox state 改變

## Debugging Checklist

如果 Web E2E 卡住，先看 timeout stack trace，而不是先改 app。

### If the failure is on `locator.click()` or `locator.fill()`

優先懷疑：

- 原生 dialog 沒被及時處理
- overlay 擋住互動
- element 實際上 disabled
- click 觸發 navigation / modal / focus trap，但測試沒有等待對應訊號

### If the failure looks like "alert not detected"

先確認：

- 是不是前一個 `confirm` 已經卡住
- 真正 timeout 的行是不是 alert assertion，而不是前面的 click
- app 是否真的有可觀察的錯誤 surface

### If the failure is flaky

先比較：

- 同一 flow 有沒有其他 working example
- 是否使用了不同 selector
- 是否某個測試忘了抽共用 helper

## Verification

修改 Playwright Web E2E 後，至少跑：

```bash
bun run e2e:web
bun run check:pw:console
```

如果只改某個 fail path，先跑最小子集合，再跑完整 suite。

## Current Local Baseline

- `bun run e2e:web`：Expo web server port `8099`
- `bun run check:pw:console`：Expo web server port `4173`
- `bun run e2e:web` 使用獨立 emulator ports：Auth `9199`、Firestore `8180`、Functions `5011`
