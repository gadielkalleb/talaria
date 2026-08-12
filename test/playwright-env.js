import { existsSync } from 'node:fs'
import { homedir } from 'node:os'
import { join } from 'node:path'

const homeCache = join(homedir(), '.cache', 'ms-playwright')
const current = process.env.PLAYWRIGHT_BROWSERS_PATH || ''

if (current.includes('cursor-sandbox-cache') && existsSync(homeCache)) {
  process.env.PLAYWRIGHT_BROWSERS_PATH = homeCache
}
