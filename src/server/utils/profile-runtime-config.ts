function asStringRecord(value: unknown): Record<string, string> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return {}
  }

  return Object.fromEntries(
    Object.entries(value).flatMap(([key, innerValue]) => (
      typeof innerValue === 'string'
        ? [[key, innerValue]]
        : []
    )),
  )
}

function asUnknownRecord(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return {}
  }

  return value as Record<string, unknown>
}

export function getProfileServerIniOverrides(profile: {
  serverIniOverrides: unknown
}): Record<string, string> {
  return asStringRecord(profile.serverIniOverrides)
}

export function getProfileSandboxVarsOverrides(profile: {
  sandboxVarsOverrides: unknown
}): Record<string, unknown> {
  return asUnknownRecord(profile.sandboxVarsOverrides)
}