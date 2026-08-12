import './playwright-env.js'
import assert from 'node:assert/strict'
import { spawn } from 'node:child_process'
import { mkdtemp, readFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { after, before, describe, test } from 'node:test'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const cliPath = join(root, 'scripts', 'cli.js')

function runCli(args, { timeout = 45_000 } = {}) {
  return new Promise((resolvePromise, reject) => {
    const child = spawn(process.execPath, [cliPath, ...args], {
      cwd: root,
      env: { ...process.env, HEADLESS: 'true' },
    })

    let stdout = ''
    let stderr = ''
    const timer = setTimeout(() => {
      child.kill('SIGKILL')
      reject(new Error(`CLI timeout após ${timeout}ms\nstderr: ${stderr}`))
    }, timeout)

    child.stdout.on('data', (chunk) => {
      stdout += chunk
    })
    child.stderr.on('data', (chunk) => {
      stderr += chunk
    })
    child.on('error', (error) => {
      clearTimeout(timer)
      reject(error)
    })
    child.on('close', (code) => {
      clearTimeout(timer)
      resolvePromise({ code, stdout, stderr })
    })
  })
}

describe('CLI', () => {
  let tmp

  before(async () => {
    tmp = await mkdtemp(join(tmpdir(), 'talaria-cli-'))
  })

  after(async () => {
    await rm(tmp, { recursive: true, force: true })
  })

  test('sem --url sai com código 1 e mostra uso', async () => {
    const { code, stderr } = await runCli([])
    assert.equal(code, 1)
    assert.match(stderr, /--url/)
  })

  test('visita example.com e grava json, html e screenshot', async () => {
    const screenshot = join(tmp, 'page.png')
    const html = join(tmp, 'page.html')

    const { code, stdout, stderr } = await runCli([
      '--url',
      'https://example.com',
      '--screenshot',
      screenshot,
      '--html',
      html,
      '--json',
    ])

    assert.equal(code, 0, `CLI falhou: ${stderr || stdout}`)

    const result = JSON.parse(stdout.trim())
    assert.ok(result.url.includes('example.com'), `url inesperada: ${result.url}`)
    assert.ok(typeof result.title === 'string' && result.title.length > 0)
    assert.equal(result.screenshot, screenshot)
    assert.equal(result.html, html)

    const htmlContent = await readFile(html, 'utf8')
    assert.ok(htmlContent.length > 0, 'HTML gravado está vazio')
    assert.match(htmlContent, /<html/i)

    const png = await readFile(screenshot)
    assert.equal(png[0], 0x89)
    assert.equal(png[1], 0x50)
    assert.equal(png[2], 0x4e)
    assert.equal(png[3], 0x47)
  })
})
