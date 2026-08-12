import './playwright-env.js'
import assert from 'node:assert/strict'
import { after, before, describe, test } from 'node:test'
import { chromium as vanillaChromium } from 'playwright'
import { launchStealthBrowser } from '../scripts/index.js'

async function stealthSignals(page) {
  return page.evaluate(() => ({
    webdriver: navigator.webdriver,
    plugins: navigator.plugins.length,
    languages: [...(navigator.languages || [])],
    userAgent: navigator.userAgent,
  }))
}

describe('launchStealthBrowser', () => {
  let browser
  let page

  before(async () => {
    ;({ browser, page } = await launchStealthBrowser({ headless: true }))
  })

  after(async () => {
    await browser?.close()
  })

  test('oculta sinais clássicos de automação em about:blank', async () => {
    await page.goto('about:blank')
    const signals = await stealthSignals(page)

    assert.ok(
      signals.webdriver === false || signals.webdriver == null,
      `navigator.webdriver deveria ser false/undefined, veio ${signals.webdriver}`,
    )
    assert.ok(signals.plugins > 0, `navigator.plugins.length deveria ser > 0, veio ${signals.plugins}`)
    assert.ok(signals.languages.length > 0, 'navigator.languages não deveria estar vazio')
    assert.equal(
      signals.userAgent.includes('HeadlessChrome'),
      false,
      `user agent não deveria conter HeadlessChrome: ${signals.userAgent}`,
    )
  })

  test('Playwright cru ainda vaza navigator.webdriver', async () => {
    const rawBrowser = await vanillaChromium.launch({ headless: true })
    try {
      const rawPage = await rawBrowser.newPage()
      await rawPage.goto('about:blank')
      const webdriver = await rawPage.evaluate(() => navigator.webdriver)
      assert.equal(webdriver, true, 'Playwright cru deveria expor navigator.webdriver === true')
    } finally {
      await rawBrowser.close()
    }
  })
})

describe('bot.sannysoft.com', () => {
  test('passa nos checks WebDriver / Chrome do artigo', async () => {
    const { browser, page } = await launchStealthBrowser({ headless: true })

    try {
      await page.goto('https://bot.sannysoft.com/', {
        waitUntil: 'domcontentloaded',
        timeout: 45_000,
      })

      const checks = await page.evaluate(() => {
        const normalize = (text) => text.replace(/\s+/g, ' ').trim()
        const out = {}
        for (const row of document.querySelectorAll('tr')) {
          const cells = [...row.querySelectorAll('td')]
          if (cells.length < 2) continue
          const name = normalize(cells[0].innerText)
          const value = normalize(cells[1].innerText)
          const passed =
            cells[1].classList.contains('passed') ||
            /passed|missing/i.test(`${cells[1].className} ${value}`)
          out[name] = { value, passed }
        }
        return {
          title: document.title,
          userAgent: navigator.userAgent,
          webdriver: navigator.webdriver,
          checks: out,
        }
      })

      const names = Object.keys(checks.checks)
      assert.ok(names.length > 0, 'tabela de resultados do sannysoft não foi encontrada')

      const webdriverRow =
        checks.checks['WebDriver (New)'] ||
        checks.checks.WebDriver ||
        checks.checks.webdriver

      assert.ok(webdriverRow, `linha WebDriver ausente. chaves: ${names.join(', ')}`)
      assert.match(
        String(webdriverRow.value),
        /missing/i,
        `WebDriver deveria ser missing, veio "${webdriverRow.value}"`,
      )

      const chromeRow = checks.checks['Chrome (New)'] || checks.checks.Chrome
      assert.ok(chromeRow, `linha Chrome ausente. chaves: ${names.join(', ')}`)

      assert.equal(
        checks.userAgent.includes('HeadlessChrome'),
        false,
        `user agent não deveria conter HeadlessChrome: ${checks.userAgent}`,
      )
      assert.ok(
        checks.webdriver === false || checks.webdriver == null,
        `navigator.webdriver no sannysoft veio ${checks.webdriver}`,
      )
    } finally {
      await browser.close()
    }
  })
})
