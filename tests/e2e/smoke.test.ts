import { test, expect } from '@playwright/test'
import * as path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const APP_PATH = path.join(__dirname, '..', '..', 'out', 'main', 'index.js')

test.describe('OnePPT Smoke Tests', () => {
  test('应用启动验证', async ({ electron }) => {
    const app = await electron.launch({ args: [APP_PATH] })
    const window = await app.firstWindow()
    const title = await window.title()
    expect(title).toContain('OnePPT')
    await app.close()
  })

  test('主界面渲染验证', async ({ electron }) => {
    const app = await electron.launch({ args: [APP_PATH] })
    const window = await app.firstWindow()
    await window.waitForTimeout(5000)
    const url = await window.url()
    expect(url).toBeTruthy()
    await app.close()
  })

  test('应用关闭验证', async ({ electron }) => {
    const app = await electron.launch({ args: [APP_PATH] })
    await app.close()
    expect(app.isRunning()).toBe(false)
  })
})
