import { describe, expect, it } from 'vitest'

import { decodeDockerLogBuffer, formatLogForDisplay, resolveServerPhase, tailLogText } from '../../server/utils/server-logs'

function dockerFrame(stream: number, line: string): Buffer {
  const payload = Buffer.from(line, 'utf-8')
  const header = Buffer.alloc(8)
  header[0] = stream
  header.writeUInt32BE(payload.length, 4)
  return Buffer.concat([header, payload])
}

describe('decodeDockerLogBuffer', () => {
  it('demuxes docker log frames and strips control characters', () => {
    const logs = Buffer.concat([
      dockerFrame(1, '\u001B[0mUpdate state (0x61) downloading, progress: 12.99\n'),
      dockerFrame(1, '\u0001Success! App \'380870\' fully installed.\n'),
    ])

    expect(decodeDockerLogBuffer(logs)).toBe([
      'Update state (0x61) downloading, progress: 12.99',
      'Success! App \'380870\' fully installed.',
    ].join('\n'))
  })
})

describe('tailLogText', () => {
  it('returns only the requested number of last lines', () => {
    expect(tailLogText('one\ntwo\nthree\nfour', 2)).toBe('three\nfour')
  })
})

describe('resolveServerPhase', () => {
  it('reports update progress from container logs before the server console exists', () => {
    const phase = resolveServerPhase(
      'Update state (0x61) downloading, progress: 52.41 (3646854099 / 6958122333)',
      '',
    )

    expect(phase).toEqual({
      state: 'updating',
      label: 'Updating',
      detail: 'Downloading server files',
      progress: 52.41,
    })
  })

  it('prefers live server console state over stale startup logs', () => {
    const phase = resolveServerPhase(
      'Success! App \'380870\' fully installed.\nUnloading Steam API...OK',
      [
        'LOG  : General > LOADING ASSETS: FINISH',
        'LOG  : Network > Loading world...',
        'LOG  : General > Loading worldgen params',
      ].join('\n'),
    )

    expect(phase).toEqual({
      state: 'initializing',
      label: 'Initializing',
      detail: 'Loading world',
    })
  })

  it('ignores benign "Property Name not found" errors during initialization', () => {
    const phase = resolveServerPhase(
      'Success! App \'380870\' fully installed.',
      [
        'LOG  : General > LOADING ASSETS: FINISH',
        'ERROR: WorldGen     f:0, t:1775383358178, st:10,128,706> IsoPropertyType.lookupOrDefaultStr> Exception thrown',
        'zombie.core.properties.IsoPropertyType$IsoPropertyTypeNotFoundException: Property Name not found: ladderW',
      ].join('\n'),
    )

    expect(phase).toEqual({
      state: 'initializing',
      label: 'Initializing',
      detail: 'Loading world',
    })
  })

  it('ignores benign "Property Name not found" errors with full stack traces', () => {
    const phase = resolveServerPhase(
      'Success! App \'380870\' fully installed.',
      [
        'LOG  : General > LOADING ASSETS: FINISH',
        'LOG  : General > LoadTileDefinitions start',
        'ERROR: WorldGen     f:0, t:1775391852338, st:185,004> IsoPropertyType.lookupOrDefaultStr> Exception thrown',
        '\tzombie.core.properties.IsoPropertyType$IsoPropertyTypeNotFoundException: Property Name not found: ladderW at IsoPropertyType.lookup(IsoPropertyType.java:269). Message: Property Name not found: ladderW',
        '\tStack trace:',
        '\t\tzombie.core.properties.IsoPropertyType.lookup(IsoPropertyType.java:269)',
        '\t\tzombie.iso.IsoWorld.init(IsoWorld.java:2171)',
        'ERROR: WorldGen     f:0, t:1775391852362, st:185,028> IsoPropertyType.lookupOrDefaultStr> Exception thrown',
        '\tzombie.core.properties.IsoPropertyType$IsoPropertyTypeNotFoundException: Property Name not found: ladderN at IsoPropertyType.lookup(IsoPropertyType.java:269)',
        '\tStack trace:',
        '\t\tzombie.core.properties.IsoPropertyType.lookup(IsoPropertyType.java:269)',
      ].join('\n'),
    )

    expect(phase).toEqual({
      state: 'initializing',
      label: 'Initializing',
      detail: 'Loading world',
    })
  })

  it('ignores benign CraftRecipeComponentScript errors', () => {
    const phase = resolveServerPhase(
      'Success! App \'380870\' fully installed.',
      [
        'LOG  : Lua > [ZomboidManager] Event hooks registered',
        'ERROR: General > CraftRecipeComponentScript.getIconTexture> CraftRecipeComponentScript: Recipe Piano missing UiConfigScript',
        'LOG  : Network > Loading world...',
      ].join('\n'),
    )

    expect(phase).toEqual({
      state: 'initializing',
      label: 'Initializing',
      detail: 'Loading world',
    })
  })

  it('ignores benign model/icon/tag errors during loading', () => {
    const phase = resolveServerPhase(
      'Success! App \'380870\' fully installed.',
      [
        'LOG  : General > LOADING ASSETS: START',
        'WARN : General      f:0, t:1775386806773, st:13,577,343> XuiSkin$EntityUiStyle.LoadComponentInfo> Could not find icon: Item_Clamp_Forged',
        'ERROR: Script       f:0, t:1775386807414, st:13,577,984> ModelScript.check > no such model "null" for Base.BareHands',
        'WARN : General      f:0, t:1775386807347, st:13,577,917> TaggedObjectManager.createTagBits > manager-> new tag discovered that was not preprocessed, tag: choppingblock',
      ].join('\n'),
    )

    expect(phase).toEqual({
      state: 'initializing',
      label: 'Initializing',
      detail: 'Loading assets',
    })
  })

  it('surfaces genuine fatal errors during initialization', () => {
    const phase = resolveServerPhase(
      'Success! App \'380870\' fully installed.',
      [
        'LOG  : General > LOADING ASSETS: FINISH',
        'LOG  : Network > Loading world...',
        'FATAL: Server failed to bind port 16261',
      ].join('\n'),
    )

    expect(phase).toEqual({
      state: 'error',
      label: 'Error',
      detail: 'Server failed to bind port 16261',
    })
  })
})

describe('formatLogForDisplay', () => {
  it('reformats Docker timestamp + log level and strips metadata fields', () => {
    const input = '2026-04-06T09:27:16.022084912Z LOG : General      f:0, t:1775467716022, st:76,050,025> Loading world'
    expect(formatLogForDisplay(input)).toBe(
      '2026-04-06 09:27:16.022 [LOG] General      Loading world',
    )
  })

  it('reformats Docker timestamp without a PZ log level', () => {
    const input = '2026-04-06T09:27:16.022084912Z [entrypoint] Starting server...'
    expect(formatLogForDisplay(input)).toBe(
      '2026-04-06 09:27:16.022 [entrypoint] Starting server...',
    )
  })

  it('reformats server console log level with epoch timestamp and strips metadata', () => {
    const input = 'WARN : Sprite       f:0, t:1775467659806, st:75,993,810> something'
    expect(formatLogForDisplay(input)).toBe(
      '2026-04-06 09:27:39.806 [WARN] Sprite       something',
    )
  })

  it('reformats server console log level without t: field', () => {
    const input = 'LOG : General > LOADING ASSETS: START'
    expect(formatLogForDisplay(input)).toBe(
      '[LOG] General > LOADING ASSETS: START',
    )
  })

  it('passes through stack trace lines unchanged', () => {
    const input = '\tzombie.core.IsoPropertyType$Exception: Property Name not found'
    expect(formatLogForDisplay(input)).toBe(input)
  })

  it('handles multi-line log with mixed formats', () => {
    const input = [
      '2026-04-06T09:27:16.022084912Z LOG : General > LOADING ASSETS: START',
      '2026-04-06T09:27:17.123456789Z ERROR: Script       f:0, t:1775467717123, st:76,051,126> no such model "null"',
      '2026-04-06T09:27:18.000000000Z [entrypoint] Done',
    ].join('\n')

    expect(formatLogForDisplay(input)).toBe([
      '2026-04-06 09:27:16.022 [LOG] General > LOADING ASSETS: START',
      '2026-04-06 09:27:17.123 [ERROR] Script       no such model "null"',
      '2026-04-06 09:27:18.000 [entrypoint] Done',
    ].join('\n'))
  })
})
