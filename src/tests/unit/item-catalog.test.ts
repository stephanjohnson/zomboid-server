import { describe, expect, it } from 'vitest'

import { buildPzWikiFileUrl } from '../../server/utils/item-catalog'
import { buildDerivedSpecs } from '../../server/utils/item-enrichment'
import { parseItemScriptText } from '../../server/utils/item-script-catalog'
import type { GameCatalogEntry } from '../../server/utils/item-catalog'

describe('parseItemScriptText', () => {
  it('extracts useful combat and equipment stats from Project Zomboid script text', () => {
    const records = parseItemScriptText(`
module Base
{
    item Katana
    {
        DisplayCategory = Weapon,
        ItemType = Weapon,
        Weight = 2.0,
        Icon = Katana,
        AttachmentType = Sword,
        Categories = longblade,
        Tags = ignorezombiedensity;hasmetal;fullblade,
        TwoHandWeapon = TRUE,
        ConditionLowerChanceOneIn = 15,
        ConditionMax = 10,
        CriticalChance = 35.0,
        DoorDamage = 8,
        MaxDamage = 8.0,
        MaxHitCount = 3,
        MaxRange = 1.4,
        MinDamage = 8.0,
        MinRange = 0.61,
        BaseSpeed = 1.0,
        TreeDamage = 1,
        PushBackMod = 0.5,
        Sharpness = 1,
    }
}
`, 'weapon.txt')

    expect(records).toHaveLength(1)
    expect(records[0]).toMatchObject({
      fullType: 'Base.Katana',
      displayCategory: 'Weapon',
      itemType: 'Weapon',
      weight: 2,
      icon: 'Katana',
      attachmentType: 'Sword',
      categories: ['longblade'],
      tags: ['ignorezombiedensity', 'hasmetal', 'fullblade'],
      isTwoHandWeapon: true,
      conditionMax: 10,
      conditionLowerChanceOneIn: 15,
      minDamage: 8,
      maxDamage: 8,
      minRange: 0.61,
      maxRange: 1.4,
      baseSpeed: 1,
      criticalChance: 35,
      maxHitCount: 3,
      treeDamage: 1,
      doorDamage: 8,
      knockback: 0.5,
      sharpness: 1,
      sourceFile: 'weapon.txt',
    })
  })
})

describe('buildDerivedSpecs', () => {
  it('formats the imported script values into storefront-friendly spec rows', () => {
    const item: GameCatalogEntry = {
      fullType: 'Base.Katana',
      name: 'Katana',
      category: 'Weapon',
      displayCategory: 'Weapon',
      iconName: 'Item_Katana',
      textureIcon: 'Katana',
      iconUrl: buildPzWikiFileUrl('Katana'),
      source: 'lua_bridge',
      itemType: 'Weapon',
      weight: 2,
      tags: ['ignorezombiedensity', 'hasmetal', 'fullblade'],
      categories: ['longblade'],
      attachmentType: 'Sword',
      attachmentSlots: ['Back'],
      isTwoHandWeapon: true,
      maxCondition: 10,
      conditionLowerChance: 15,
      minDamage: 8,
      maxDamage: 8,
      minRange: 0.61,
      maxRange: 1.4,
      attackSpeed: 1,
      critChance: 35,
      maxHitCount: 3,
      treeDamage: 1,
      doorDamage: 8,
      knockback: 0.5,
      sharpness: 1,
      scriptSource: '/pzm-server/media/scripts/weapons.txt',
    }

    expect(buildDerivedSpecs(item)).toEqual(expect.arrayContaining([
      { group: 'General', label: 'Encumbrance', value: '2' },
      { group: 'General', label: 'Equipped', value: 'Two-handed' },
      { group: 'Properties', label: 'Max condition', value: '10' },
      { group: 'Performance', label: 'Damage', value: '8' },
      { group: 'Performance', label: 'Range', value: '0.61-1.4' },
      { group: 'Technical', label: 'Item ID', value: 'Base.Katana' },
    ]))
  })
})
