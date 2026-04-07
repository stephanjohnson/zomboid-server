import { constants } from 'node:fs'
import { access, readFile, readdir } from 'node:fs/promises'
import { homedir } from 'node:os'
import { join, relative } from 'node:path'

import { getPzServerPath } from './runtime-paths'

const PROJECT_ZOMBOID_APP_ID = 108600
const STEAM_WORKSHOP_DETAILS_URL = 'https://api.steampowered.com/ISteamRemoteStorage/GetPublishedFileDetails/v1/'
const STEAM_WORKSHOP_SEARCH_URL = 'https://steamcommunity.com/workshop/browse/'

interface SteamWorkshopTag {
  tag?: string
}

interface SteamWorkshopDetail {
  publishedfileid?: string
  result?: number
  consumer_app_id?: number | string
  title?: string
  description?: string
  preview_url?: string
  tags?: SteamWorkshopTag[]
}

interface SteamWorkshopDetailsResponse {
  response?: {
    publishedfiledetails?: SteamWorkshopDetail[]
  }
}

interface ParsedWorkshopModInfo {
  id: string | null
  name: string | null
}

export interface WorkshopInstalledMod {
  id: string
  name: string | null
  relativePath: string
}

export interface WorkshopItemCandidate {
  workshopId: string
  workshopUrl: string
  title: string
  displayName: string
  previewUrl: string | null
  descriptionSnippet: string | null
  modIds: string[]
  resolvedFrom: 'mod-info' | 'description' | 'unknown'
  tags: string[]
  warnings: string[]
}

export interface WorkshopItemSummary {
  workshopId: string
  title: string
  previewUrl: string | null
}

function uniqueStrings(values: Iterable<string>): string[] {
  const seen = new Set<string>()
  const result: string[] = []

  for (const value of values) {
    const normalized = value.trim()
    if (!normalized || seen.has(normalized)) {
      continue
    }

    seen.add(normalized)
    result.push(normalized)
  }

  return result
}

export function extractWorkshopId(input: string): string | null {
  const normalizedInput = input.trim()

  if (!normalizedInput.length) {
    return null
  }

  if (/^\d+$/.test(normalizedInput)) {
    return normalizedInput
  }

  try {
    const parsed = new URL(normalizedInput)
    const directId = parsed.searchParams.get('id')

    if (directId && /^\d+$/.test(directId)) {
      return directId
    }
  }
  catch {
    // Fall through to regex matching for copied text that is not a fully valid URL.
  }

  const urlMatch = normalizedInput.match(/[?&]id=(\d+)/i)
  if (urlMatch) {
    return urlMatch[1]
  }

  return null
}

export function normalizeSemicolonList(input: string): string {
  return uniqueStrings(
    input
      .split(';')
      .map(value => value.trim()),
  ).join(';')
}

export function parseWorkshopDescriptionModIds(description: string): string[] {
  const bbCodeStripped = description
    .replace(/\r/g, '')
    .replace(/\[\/?[^\]]+\]/g, ' ')

  const ids = new Set<string>()

  for (const line of bbCodeStripped.split('\n')) {
    const normalizedLine = line.trim()
    if (!normalizedLine) {
      continue
    }

    const match = normalizedLine.match(/(?:^|\b)mod\s*ids?\s*:\s*(.+)$/i)
      ?? normalizedLine.match(/(?:^|\b)modid\s*:\s*(.+)$/i)

    if (!match) {
      continue
    }

    const candidates = match[1]
      .split(/[;,|]/)
      .map(candidate => candidate.trim())
      .filter(Boolean)

    for (const candidate of candidates) {
      ids.add(candidate)
    }
  }

  return [...ids]
}

export function parseWorkshopSearchResultIds(html: string): string[] {
  const ids = html.matchAll(/publishedfileid="(\d+)"/g)
  return uniqueStrings(Array.from(ids, match => match[1]))
}

export function parseWorkshopModInfo(content: string): ParsedWorkshopModInfo {
  let id: string | null = null
  let name: string | null = null

  for (const line of content.split(/\r?\n/)) {
    const separatorIndex = line.indexOf('=')
    if (separatorIndex < 0) {
      continue
    }

    const key = line.slice(0, separatorIndex).trim().toLowerCase()
    const value = line.slice(separatorIndex + 1).trim()

    if (!value) {
      continue
    }

    if (key === 'id') {
      id = value
    }
    else if (key === 'name') {
      name = value
    }
  }

  return { id, name }
}

async function pathExists(path: string): Promise<boolean> {
  try {
    await access(path, constants.F_OK)
    return true
  }
  catch {
    return false
  }
}

function getWorkshopContentRoots(): string[] {
  const home = homedir()

  return uniqueStrings([
    join(getPzServerPath(), 'steamapps', 'workshop', 'content', String(PROJECT_ZOMBOID_APP_ID)),
    join(home, '.local', 'share', 'Steam', 'steamapps', 'workshop', 'content', String(PROJECT_ZOMBOID_APP_ID)),
    join(home, '.steam', 'steam', 'steamapps', 'workshop', 'content', String(PROJECT_ZOMBOID_APP_ID)),
  ])
}

async function findModInfoFiles(rootDir: string, depth = 4): Promise<string[]> {
  if (depth < 0) {
    return []
  }

  let entries
  try {
    entries = await readdir(rootDir, { withFileTypes: true })
  }
  catch {
    return []
  }

  const files: string[] = []

  for (const entry of entries) {
    const entryPath = join(rootDir, entry.name)

    if (entry.isFile() && entry.name === 'mod.info') {
      files.push(entryPath)
      continue
    }

    if (entry.isDirectory()) {
      files.push(...await findModInfoFiles(entryPath, depth - 1))
    }
  }

  return files
}

export async function readInstalledWorkshopMods(workshopId: string): Promise<WorkshopInstalledMod[]> {
  for (const rootDir of getWorkshopContentRoots()) {
    const workshopRoot = join(rootDir, workshopId)

    if (!await pathExists(workshopRoot)) {
      continue
    }

    const modInfoFiles = await findModInfoFiles(workshopRoot)
    const mods = new Map<string, WorkshopInstalledMod>()

    for (const modInfoFile of modInfoFiles) {
      const parsed = parseWorkshopModInfo(await readFile(modInfoFile, 'utf-8'))
      if (!parsed.id) {
        continue
      }

      if (mods.has(parsed.id)) {
        continue
      }

      mods.set(parsed.id, {
        id: parsed.id,
        name: parsed.name,
        relativePath: relative(workshopRoot, modInfoFile),
      })
    }

    if (mods.size > 0) {
      return [...mods.values()]
    }
  }

  return []
}

function toWorkshopUrl(workshopId: string): string {
  return `https://steamcommunity.com/sharedfiles/filedetails/?id=${workshopId}`
}

function sanitizeWorkshopDescription(description: string): string | null {
  const sanitized = description
    .replace(/\[\/?[^\]]+\]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()

  if (!sanitized.length) {
    return null
  }

  return sanitized.slice(0, 240)
}

async function fetchWorkshopDetailsBatch(workshopIds: string[]): Promise<SteamWorkshopDetail[]> {
  if (!workshopIds.length) {
    return []
  }

  const formData = new URLSearchParams()
  formData.set('itemcount', String(workshopIds.length))
  workshopIds.forEach((workshopId, index) => {
    formData.set(`publishedfileids[${index}]`, workshopId)
  })

  const response = await $fetch<SteamWorkshopDetailsResponse>(STEAM_WORKSHOP_DETAILS_URL, {
    method: 'POST',
    body: formData.toString(),
    headers: {
      'content-type': 'application/x-www-form-urlencoded; charset=UTF-8',
    },
    signal: AbortSignal.timeout(10000),
  })

  return (response.response?.publishedfiledetails ?? []).filter((detail) => {
    return detail.result === 1 && Number(detail.consumer_app_id) === PROJECT_ZOMBOID_APP_ID && Boolean(detail.publishedfileid)
  })
}

function toWorkshopItemSummary(detail: SteamWorkshopDetail): WorkshopItemSummary | null {
  if (!detail.publishedfileid) {
    return null
  }

  return {
    workshopId: detail.publishedfileid,
    title: detail.title?.trim() || detail.publishedfileid,
    previewUrl: detail.preview_url ?? null,
  }
}

export async function fetchWorkshopItemSummaries(workshopIds: string[]): Promise<Map<string, WorkshopItemSummary>> {
  const details = await fetchWorkshopDetailsBatch(uniqueStrings(workshopIds))

  return new Map(
    details
      .map(detail => toWorkshopItemSummary(detail))
      .filter((summary): summary is WorkshopItemSummary => Boolean(summary))
      .map(summary => [summary.workshopId, summary] as const),
  )
}

function toCandidateFromDetail(detail: SteamWorkshopDetail, installedMods: WorkshopInstalledMod[]): WorkshopItemCandidate {
  const workshopId = detail.publishedfileid!
  const description = detail.description ?? ''
  const descriptionModIds = parseWorkshopDescriptionModIds(description)
  const installedModIds = installedMods.map(mod => mod.id)
  const resolvedModIds = installedModIds.length > 0 ? installedModIds : descriptionModIds
  const resolvedFrom = installedModIds.length > 0
    ? 'mod-info'
    : descriptionModIds.length > 0
      ? 'description'
      : 'unknown'

  const warnings: string[] = []

  if (resolvedFrom === 'description') {
    warnings.push('Mod ID(s) came from the workshop description. Review them before saving.')
  }

  if (resolvedModIds.length === 0) {
    warnings.push('Could not resolve Mod ID(s) automatically. Enter them manually if the workshop item contains one or more Project Zomboid mods.')
  }

  return {
    workshopId,
    workshopUrl: toWorkshopUrl(workshopId),
    title: detail.title?.trim() || workshopId,
    displayName: detail.title?.trim() || installedMods[0]?.name || workshopId,
    previewUrl: detail.preview_url ?? null,
    descriptionSnippet: sanitizeWorkshopDescription(description),
    modIds: uniqueStrings(resolvedModIds),
    resolvedFrom,
    tags: uniqueStrings((detail.tags ?? []).map(tag => tag.tag ?? '').filter(Boolean)),
    warnings,
  }
}

async function hydrateWorkshopCandidates(details: SteamWorkshopDetail[]): Promise<WorkshopItemCandidate[]> {
  const candidates: WorkshopItemCandidate[] = []

  for (const detail of details) {
    const workshopId = detail.publishedfileid
    if (!workshopId) {
      continue
    }

    const installedMods = await readInstalledWorkshopMods(workshopId)
    candidates.push(toCandidateFromDetail(detail, installedMods))
  }

  return candidates
}

export async function resolveWorkshopItem(input: string): Promise<WorkshopItemCandidate> {
  const workshopId = extractWorkshopId(input)
  if (!workshopId) {
    throw new Error('Enter a valid Steam Workshop URL or workshop ID.')
  }

  const details = await fetchWorkshopDetailsBatch([workshopId])
  if (!details.length) {
    throw new Error('No Project Zomboid workshop item was found for that input.')
  }

  const [candidate] = await hydrateWorkshopCandidates(details)
  if (!candidate) {
    throw new Error('No Project Zomboid workshop item was found for that input.')
  }

  return candidate
}

export async function searchWorkshopItems(query: string, limit = 12): Promise<WorkshopItemCandidate[]> {
  const normalizedQuery = query.trim()
  if (normalizedQuery.length < 2) {
    return []
  }

  const html = await $fetch<string>(STEAM_WORKSHOP_SEARCH_URL, {
    query: {
      appid: String(PROJECT_ZOMBOID_APP_ID),
      searchtext: normalizedQuery,
    },
    responseType: 'text',
    signal: AbortSignal.timeout(10000),
  })

  const workshopIds = parseWorkshopSearchResultIds(html).slice(0, limit)
  if (!workshopIds.length) {
    return []
  }

  const details = await fetchWorkshopDetailsBatch(workshopIds)
  const detailsById = new Map(details.map(detail => [detail.publishedfileid!, detail] as const))
  const orderedDetails = workshopIds
    .map(workshopId => detailsById.get(workshopId))
    .filter((detail): detail is SteamWorkshopDetail => Boolean(detail))

  return hydrateWorkshopCandidates(orderedDetails)
}