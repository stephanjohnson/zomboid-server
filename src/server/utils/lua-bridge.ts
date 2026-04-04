import { readdir, readFile, writeFile, mkdir } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { join } from 'node:path'

/**
 * Read JSON files from the lua-bridge inbox (written by Lua mod).
 */
export async function readBridgeInbox(profileName: string): Promise<Record<string, unknown>[]> {
  const config = useRuntimeConfig()
  const inboxDir = join(config.luaBridgePath, profileName, 'inbox')

  if (!existsSync(inboxDir)) return []

  const files = await readdir(inboxDir)
  const results: Record<string, unknown>[] = []

  for (const file of files.filter(f => f.endsWith('.json'))) {
    const content = await readFile(join(inboxDir, file), 'utf-8')
    try {
      results.push(JSON.parse(content))
    }
    catch {
      logger.warn(`Failed to parse lua-bridge inbox file: ${file}`)
    }
  }

  return results
}

/**
 * Write a command JSON file for the Lua mod to consume.
 */
export async function writeBridgeCommand(
  profileName: string,
  command: Record<string, unknown>,
): Promise<void> {
  const config = useRuntimeConfig()
  const outboxDir = join(config.luaBridgePath, profileName, 'outbox')

  if (!existsSync(outboxDir)) {
    await mkdir(outboxDir, { recursive: true })
  }

  const filename = `cmd_${Date.now()}.json`
  await writeFile(join(outboxDir, filename), JSON.stringify(command), 'utf-8')
}
