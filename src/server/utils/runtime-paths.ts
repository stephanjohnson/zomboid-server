import { isAbsolute, resolve } from 'node:path'

function resolveRuntimePath(envName: string, configuredPath: string | undefined, fallback: string): string {
  const runtimePath = process.env[`NUXT_${envName}`] ?? process.env[envName] ?? configuredPath ?? fallback

  return isAbsolute(runtimePath) ? runtimePath : resolve(process.cwd(), runtimePath)
}

export function getPzDataPath(): string {
  const config = useRuntimeConfig()
  return resolveRuntimePath('PZ_DATA_PATH', config.pzDataPath, '/pz-data')
}