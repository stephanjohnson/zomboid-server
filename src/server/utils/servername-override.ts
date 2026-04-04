import { mkdir, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'

export async function writeActiveServernameOverride(servername: string): Promise<void> {
  const normalizedServername = servername.trim()
  if (!normalizedServername) {
    return
  }

  const config = useRuntimeConfig()
  const overridePath = join(config.pzDataPath, '.servername')

  await mkdir(dirname(overridePath), { recursive: true })
  await writeFile(overridePath, `${normalizedServername}\n`, 'utf8')
}
