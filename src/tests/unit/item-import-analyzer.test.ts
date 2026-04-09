import { describe, expect, it } from 'vitest'

import { analyzeMultiImport } from '../../server/utils/item-import-analyzer'
import type { GameCatalogEntry } from '../../server/utils/item-catalog'

function makeCatalogEntry(overrides: Partial<GameCatalogEntry> & Pick<GameCatalogEntry, 'fullType' | 'name'>): GameCatalogEntry {
  return {
    fullType: overrides.fullType,
    name: overrides.name,
    category: overrides.category ?? 'ProtectiveGear',
    displayCategory: overrides.displayCategory ?? overrides.category ?? 'ProtectiveGear',
    iconName: overrides.iconName ?? null,
    textureIcon: overrides.textureIcon ?? null,
    iconUrl: overrides.iconUrl ?? null,
    source: overrides.source ?? 'scripts',
    itemType: overrides.itemType ?? null,
    weight: overrides.weight ?? 0.5,
    tags: overrides.tags ?? [],
    categories: overrides.categories ?? [],
    attachmentType: overrides.attachmentType ?? null,
    attachmentSlots: overrides.attachmentSlots ?? [],
    isTwoHandWeapon: overrides.isTwoHandWeapon ?? null,
    maxCondition: overrides.maxCondition ?? null,
    conditionLowerChance: overrides.conditionLowerChance ?? null,
    minDamage: overrides.minDamage ?? null,
    maxDamage: overrides.maxDamage ?? null,
    minRange: overrides.minRange ?? null,
    maxRange: overrides.maxRange ?? null,
    attackSpeed: overrides.attackSpeed ?? null,
    critChance: overrides.critChance ?? null,
    maxHitCount: overrides.maxHitCount ?? null,
    treeDamage: overrides.treeDamage ?? null,
    doorDamage: overrides.doorDamage ?? null,
    knockback: overrides.knockback ?? null,
    sharpness: overrides.sharpness ?? null,
    scriptSource: overrides.scriptSource ?? null,
    scriptProperties: overrides.scriptProperties ?? null,
  }
}

describe('analyzeMultiImport', () => {
  it('keeps only concrete image-backed variants and avoids generating a shared color matrix', () => {
    const selectedItems: GameCatalogEntry[] = [
      makeCatalogEntry({ fullType: 'Base.ElbowPad_Left', name: 'Elbow Pad Left' }),
      makeCatalogEntry({ fullType: 'Base.ElbowPad_Right', name: 'Elbow Pad Right' }),
      makeCatalogEntry({ fullType: 'Base.ElbowPad_Left_Leather', name: 'Elbow Pad Left Leather', iconUrl: 'https://example.test/elbowpad-leather.png' }),
      makeCatalogEntry({ fullType: 'Base.ElbowPad_Right_Leather', name: 'Elbow Pad Right Leather', iconUrl: 'https://example.test/elbowpad-leather.png' }),
      makeCatalogEntry({ fullType: 'Base.ElbowPad_Left_Military', name: 'Elbow Pad Left Military', iconUrl: 'https://example.test/elbowpad-military.png' }),
      makeCatalogEntry({ fullType: 'Base.ElbowPad_Right_Military', name: 'Elbow Pad Right Military', iconUrl: 'https://example.test/elbowpad-military.png' }),
      makeCatalogEntry({ fullType: 'Base.ElbowPad_Left_Sport', name: 'Elbow Pad Left Sport', iconUrl: 'https://example.test/elbowpad-sport.png' }),
      makeCatalogEntry({ fullType: 'Base.ElbowPad_Right_Sport', name: 'Elbow Pad Right Sport', iconUrl: 'https://example.test/elbowpad-sport.png' }),
      makeCatalogEntry({ fullType: 'Base.ElbowPad_Left_Tactical', name: 'Elbow Pad Left Tactical', iconUrl: 'https://example.test/elbowpad-tactical.png' }),
      makeCatalogEntry({ fullType: 'Base.ElbowPad_Right_Tactical', name: 'Elbow Pad Right Tactical', iconUrl: 'https://example.test/elbowpad-tactical.png' }),
      makeCatalogEntry({ fullType: 'Base.ElbowPad_Left_TINT', name: 'Elbow Pad Left TINT' }),
      makeCatalogEntry({ fullType: 'Base.ElbowPad_Right_TINT', name: 'Elbow Pad Right TINT' }),
      makeCatalogEntry({ fullType: 'Base.ElbowPad_Left_Workman', name: 'Elbow Pad Left Workman', iconUrl: 'https://example.test/elbowpad-workman.png' }),
      makeCatalogEntry({ fullType: 'Base.ElbowPad_Right_Workman', name: 'Elbow Pad Right Workman', iconUrl: 'https://example.test/elbowpad-workman.png' }),
    ]

    const analysis = analyzeMultiImport(selectedItems, selectedItems)

    expect(analysis.productName).toBe('Elbow Pad')
    expect(analysis.suggestedOptionGroups).toHaveLength(1)
    expect(analysis.suggestedOptionGroups[0]).toMatchObject({
      name: 'Style',
      slug: 'style',
      displayType: 'TEXT',
    })
    expect(analysis.suggestedOptionGroups[0]?.values.map(value => value.label)).toEqual([
      'Leather',
      'Military',
      'Sport',
      'Tactical',
      'Workman',
    ])

    expect(analysis.suggestedVariants).toHaveLength(5)
    expect(analysis.suggestedVariants.every(variant => Boolean(variant.imageUrl))).toBe(true)
    expect(analysis.suggestedVariants.map(variant => variant.name)).toEqual([
      'Leather',
      'Military',
      'Sport',
      'Tactical',
      'Workman',
    ])
    expect(analysis.suggestedVariants.map(variant => variant.selections)).toEqual([
      { style: 'leather' },
      { style: 'military' },
      { style: 'sport' },
      { style: 'tactical' },
      { style: 'workman' },
    ])
  })

  it('keeps imageless variants when no image-backed alternatives exist', () => {
    const selectedItems: GameCatalogEntry[] = [
      makeCatalogEntry({ fullType: 'Base.Glove_Left', name: 'Glove Left' }),
      makeCatalogEntry({ fullType: 'Base.Glove_Right', name: 'Glove Right' }),
      makeCatalogEntry({ fullType: 'Base.Glove_Left_TINT', name: 'Glove Left TINT' }),
      makeCatalogEntry({ fullType: 'Base.Glove_Right_TINT', name: 'Glove Right TINT' }),
    ]

    const analysis = analyzeMultiImport(selectedItems, selectedItems)

    expect(analysis.suggestedOptionGroups).toHaveLength(1)
    expect(analysis.suggestedVariants).toHaveLength(2)
    expect(analysis.suggestedVariants.every(variant => variant.imageUrl === null)).toBe(true)
  })

  it('removes the common product prefix from single-item style labels', () => {
    const selectedItems: GameCatalogEntry[] = [
      makeCatalogEntry({ fullType: 'Base.Jacket_ArmyCamoDesert', name: 'Jacket Army Camo Desert', iconUrl: 'https://example.test/jacket-camo-sand.png', weight: 2 }),
      makeCatalogEntry({ fullType: 'Base.Jacket_ArmyCamoDesertNew', name: 'Jacket Army Camo Desert New', iconUrl: 'https://example.test/jacket-camo-desert.png', weight: 2 }),
      makeCatalogEntry({ fullType: 'Base.Jacket_ArmyCamoGreen', name: 'Jacket Army Camo Green', iconUrl: 'https://example.test/jacket-camo-green.png', weight: 2 }),
      makeCatalogEntry({ fullType: 'Base.Jacket_ArmyCamoMilius', name: 'Jacket Army Camo Milius', iconUrl: 'https://example.test/jacket-camo-spots.png', weight: 2 }),
      makeCatalogEntry({ fullType: 'Base.Jacket_ArmyCamoTigerStripe', name: 'Jacket Army Camo Tiger Stripe', iconUrl: 'https://example.test/jacket-camo-stripes.png', weight: 2 }),
      makeCatalogEntry({ fullType: 'Base.Jacket_ArmyCamoUrban', name: 'Jacket Army Camo Urban', iconUrl: 'https://example.test/jacket-camo-grey.png', weight: 2 }),
    ]

    const analysis = analyzeMultiImport(selectedItems, selectedItems)

    expect(analysis.productName).toBe('Jacket Army Camo')
    expect(analysis.suggestedOptionGroups).toHaveLength(1)
    expect(analysis.suggestedOptionGroups[0]?.values.map(value => value.label)).toEqual([
      'Desert',
      'Desert New',
      'Green',
      'Milius',
      'Tiger Stripe',
      'Urban',
    ])
    expect(analysis.suggestedVariants.map(variant => variant.name)).toEqual([
      'Desert',
      'Desert New',
      'Green',
      'Milius',
      'Tiger Stripe',
      'Urban',
    ])
  })
})