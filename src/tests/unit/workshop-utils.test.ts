import { beforeEach, describe, expect, it, vi } from 'vitest'

import {
  extractWorkshopId,
  fetchWorkshopItemSummaries,
  normalizeSemicolonList,
  parseWorkshopDescriptionModIds,
  parseWorkshopModInfo,
  parseWorkshopSearchResultIds,
} from '../../server/utils/workshop'

beforeEach(() => {
  vi.unstubAllGlobals()
})

describe('extractWorkshopId', () => {
  it('accepts a raw workshop ID', () => {
    expect(extractWorkshopId('2200148440')).toBe('2200148440')
  })

  it('extracts the workshop ID from a Steam workshop URL', () => {
    expect(extractWorkshopId('https://steamcommunity.com/sharedfiles/filedetails/?id=2200148440')).toBe('2200148440')
  })

  it('returns null for unsupported input', () => {
    expect(extractWorkshopId('Brita weapon pack')).toBeNull()
  })
})

describe('normalizeSemicolonList', () => {
  it('deduplicates and trims semicolon-separated values', () => {
    expect(normalizeSemicolonList('Brita; Arsenal26GunFighter ;Brita')).toBe('Brita;Arsenal26GunFighter')
  })
})

describe('parseWorkshopDescriptionModIds', () => {
  it('extracts Mod ID lines from workshop descriptions', () => {
    const description = '[b]Workshop ID:[/b] 2200148440\nMod ID: Brita; Arsenal(26)GunFighter\nBuild 42'

    expect(parseWorkshopDescriptionModIds(description)).toEqual(['Brita', 'Arsenal(26)GunFighter'])
  })
})

describe('parseWorkshopSearchResultIds', () => {
  it('collects unique workshop IDs from search HTML', () => {
    const html = `
      <div publishedfileid="2200148440"></div>
      <div publishedfileid="2460154811"></div>
      <div publishedfileid="2200148440"></div>
    `

    expect(parseWorkshopSearchResultIds(html)).toEqual(['2200148440', '2460154811'])
  })
})

describe('parseWorkshopModInfo', () => {
  it('reads id and name from mod.info content', () => {
    const modInfo = 'name=Brita\nid=Brita\ndescription=Weapons'

    expect(parseWorkshopModInfo(modInfo)).toEqual({
      id: 'Brita',
      name: 'Brita',
    })
  })
})

describe('fetchWorkshopItemSummaries', () => {
  it('returns workshop preview metadata keyed by workshop ID', async () => {
    const fetchMock = vi.fn().mockResolvedValueOnce({
      response: {
        publishedfiledetails: [
          {
            publishedfileid: '2200148440',
            result: 1,
            consumer_app_id: 108600,
            title: 'Brita\'s Weapon Pack',
            preview_url: 'https://cdn.example.com/brita.jpg',
          },
        ],
      },
    })

    vi.stubGlobal('$fetch', fetchMock)

    const summaries = await fetchWorkshopItemSummaries(['2200148440'])

    expect(fetchMock).toHaveBeenCalledOnce()
    expect(summaries.get('2200148440')).toEqual({
      workshopId: '2200148440',
      title: 'Brita\'s Weapon Pack',
      previewUrl: 'https://cdn.example.com/brita.jpg',
    })
  })
})