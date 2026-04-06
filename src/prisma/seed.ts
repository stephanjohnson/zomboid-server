import { PrismaClient, UserRole } from '@prisma/client'

import { hashPassword } from '../server/lib/password'
import { toServerSlug } from '../server/utils/setup'
import { defaultActionRules, defaultTelemetryListeners } from '../server/utils/telemetry-config'

const prisma = new PrismaClient()

function storeSlug(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

async function seedStoreCatalog(profileId: string) {
  const categorySpecs = [
    {
      name: 'Armor',
      slug: 'armor',
      description: 'Protective gear, plate carriers, and modular body kit components.',
      heroTitle: 'Protective Gear',
      heroDescription: 'Loadout-ready armor lanes for tactical, militia, or faction-themed kits.',
      accentColor: '#b45309',
      sortOrder: 1,
    },
    {
      name: 'Military Loadouts',
      slug: 'military-loadouts',
      description: 'Faction bundles, weapons, and accessories built around military roles.',
      heroTitle: 'Military Kits',
      heroDescription: 'Group together rifles, magazines, ammo, and armor into one merchandising lane.',
      accentColor: '#0f766e',
      sortOrder: 2,
    },
    {
      name: 'Weapons',
      slug: 'weapons',
      description: 'Firearms and premium weapon drops for event stores and late-game loadouts.',
      heroTitle: 'Weapons Locker',
      heroDescription: 'Sell rare weapons with clear upgrade paths and obvious attachments.',
      accentColor: '#7c3aed',
      sortOrder: 3,
    },
    {
      name: 'Ammo & Support',
      slug: 'ammo-support',
      description: 'Magazines, ammunition, and support items that naturally cross-sell with weapons.',
      heroTitle: 'Ammo & Support',
      heroDescription: 'Pair high-ticket items with the consumables they actually need.',
      accentColor: '#2563eb',
      sortOrder: 4,
    },
  ]

  for (const category of categorySpecs) {
    await prisma.storeCategory.upsert({
      where: {
        profileId_slug: {
          profileId,
          slug: category.slug,
        },
      },
      update: category,
      create: {
        profileId,
        ...category,
        isActive: true,
        isFeatured: true,
      },
    })
  }

  const categories = await prisma.storeCategory.findMany({
    where: {
      profileId,
      slug: {
        in: categorySpecs.map(category => category.slug),
      },
    },
  })

  const categoryIdsBySlug = new Map(categories.map(category => [category.slug, category.id]))

  const bundleSlugs = ['m16-starter-kit', 'patrol-kneepad-pair']
  await prisma.storeBundle.deleteMany({
    where: {
      profileId,
      slug: {
        in: bundleSlugs,
      },
    },
  })

  const productSpecs = [
    {
      name: 'Military Kneepads',
      slug: 'military-kneepads',
      summary: 'One merchandised product with side and camo selectors mapped to exact in-game item codes.',
      description: 'Use variants to keep left and right kneepads under one product while still mapping every finish to a real Project Zomboid item code.',
      overview: 'This seed demonstrates the catalog shape for armor pieces that belong in more than one category and need two selection axes at once.',
      featureBullets: [
        'One parent product with left/right and finish selectors.',
        'Variant-level stock and compare-at pricing.',
        'Belongs to both Armor and Military Loadouts.',
      ],
      specs: [
        { group: 'Gear', label: 'Coverage', value: 'Left or right knee' },
        { group: 'Gear', label: 'Finish', value: 'Desert, Urban, or Army camo' },
        { group: 'Catalog', label: 'Variant axes', value: 'Side and Finish' },
      ],
      badge: 'Configurable',
      accentColor: '#b45309',
      isFeatured: true,
      categorySlugs: ['armor', 'military-loadouts'],
      optionGroups: [
        {
          name: 'Side',
          slug: 'side',
          displayType: 'TEXT' as const,
          values: [
            { label: 'Left', slug: 'left' },
            { label: 'Right', slug: 'right' },
          ],
        },
        {
          name: 'Finish',
          slug: 'finish',
          displayType: 'COLOR' as const,
          values: [
            { label: 'Desert', slug: 'desert', colorHex: '#d4a574' },
            { label: 'Urban', slug: 'urban', colorHex: '#6b7280' },
            { label: 'Army Camo', slug: 'army-camo', colorHex: '#556b2f' },
          ],
        },
      ],
      variants: [
        { name: 'Left / Desert', sku: 'KPAD-L-DESERT', itemCode: 'Base.Kneepad_Left_Desert', gameName: 'Military Kneepad Left (Desert)', gameCategory: 'Clothing', price: 750, compareAtPrice: 900, stock: 6, isDefault: true, selections: { side: 'left', finish: 'desert' } },
        { name: 'Right / Desert', sku: 'KPAD-R-DESERT', itemCode: 'Base.Kneepad_Right_Desert', gameName: 'Military Kneepad Right (Desert)', gameCategory: 'Clothing', price: 750, compareAtPrice: 900, stock: 6, selections: { side: 'right', finish: 'desert' } },
        { name: 'Left / Urban', sku: 'KPAD-L-URBAN', itemCode: 'Base.Kneepad_Left_Urban', gameName: 'Military Kneepad Left (Urban)', gameCategory: 'Clothing', price: 775, compareAtPrice: 925, stock: 4, selections: { side: 'left', finish: 'urban' } },
        { name: 'Right / Urban', sku: 'KPAD-R-URBAN', itemCode: 'Base.Kneepad_Right_Urban', gameName: 'Military Kneepad Right (Urban)', gameCategory: 'Clothing', price: 775, compareAtPrice: 925, stock: 4, selections: { side: 'right', finish: 'urban' } },
        { name: 'Left / Army Camo', sku: 'KPAD-L-ARMY', itemCode: 'Base.Kneepad_Left_Army', gameName: 'Military Kneepad Left (Army Camo)', gameCategory: 'Clothing', price: 800, compareAtPrice: 950, stock: 3, selections: { side: 'left', finish: 'army-camo' } },
        { name: 'Right / Army Camo', sku: 'KPAD-R-ARMY', itemCode: 'Base.Kneepad_Right_Army', gameName: 'Military Kneepad Right (Army Camo)', gameCategory: 'Clothing', price: 800, compareAtPrice: 950, stock: 3, selections: { side: 'right', finish: 'army-camo' } },
      ],
    },
    {
      name: 'M16 Rifle',
      slug: 'm16-rifle',
      summary: 'High-ticket rifle listing designed to cross-sell directly into magazine and ammo products.',
      description: 'This product demonstrates recommendation links and technical spec rows for weapons.',
      overview: 'Pair this listing with compatible magazines and ammunition so the product detail page can suggest a complete purchase path.',
      featureBullets: [
        'Single-variant weapon parent for premium rifle sales.',
        'Technical specs seeded for future wiki enrichment.',
        'Cross-sells into magazine and ammo support products.',
      ],
      specs: [
        { group: 'Weapon', label: 'Ammo', value: '5.56 NATO' },
        { group: 'Weapon', label: 'Magazine', value: 'STANAG / M16 Magazine' },
        { group: 'Combat', label: 'Role', value: 'Mid-range automatic rifle' },
      ],
      badge: 'Premium',
      accentColor: '#7c3aed',
      isFeatured: true,
      categorySlugs: ['weapons', 'military-loadouts'],
      optionGroups: [],
      variants: [
        { name: 'Standard Issue', sku: 'M16-RIFLE', itemCode: 'Base.M16Rifle', gameName: 'M16 Rifle', gameCategory: 'Weapon', price: 12000, compareAtPrice: 14000, stock: 3, isDefault: true, selections: {} },
      ],
    },
    {
      name: 'M16 Magazine',
      slug: 'm16-magazine',
      summary: 'A clean companion product for rifle listings and bundle assembly.',
      description: 'Use this as a recommendation target for any M16-family weapon or bundle.',
      overview: 'Support products work best when they can be recommended from a primary product detail page.',
      featureBullets: [
        'Low-friction attachment upsell.',
        'Works as both a standalone product and bundle line item.',
      ],
      specs: [
        { group: 'Support', label: 'Compatibility', value: 'M16 rifle family' },
        { group: 'Support', label: 'Type', value: 'Detachable magazine' },
      ],
      badge: 'Add-on',
      accentColor: '#2563eb',
      isFeatured: false,
      categorySlugs: ['ammo-support', 'military-loadouts'],
      optionGroups: [],
      variants: [
        { name: 'Standard Magazine', sku: 'M16-MAG', itemCode: 'Base.M16Magazine', gameName: 'M16 Magazine', gameCategory: 'Ammo', price: 1800, compareAtPrice: 2200, stock: 12, isDefault: true, selections: {} },
      ],
    },
    {
      name: '5.56 Ammo Crate',
      slug: '556-ammo-crate',
      summary: 'Ammo support product with pack-size variants for recommendation and bundle building.',
      description: 'This seed demonstrates a simple one-axis variant selector that changes the price and quantity sold.',
      overview: 'Ammo is a natural recommendation target because it keeps weapon listings from ending at the gun itself.',
      featureBullets: [
        'Selectable pack sizes for flexible pricing.',
        'Cross-sell target for rifle products and starter bundles.',
      ],
      specs: [
        { group: 'Ammo', label: 'Caliber', value: '5.56 NATO' },
        { group: 'Ammo', label: 'Pack sizes', value: '60-round and 120-round crate' },
      ],
      badge: 'Consumable',
      accentColor: '#2563eb',
      isFeatured: false,
      categorySlugs: ['ammo-support', 'military-loadouts'],
      optionGroups: [
        {
          name: 'Pack Size',
          slug: 'pack-size',
          displayType: 'TEXT' as const,
          values: [
            { label: '60 Rounds', slug: '60-rounds' },
            { label: '120 Rounds', slug: '120-rounds' },
          ],
        },
      ],
      variants: [
        { name: '60 Rounds', sku: '556-CRATE-60', itemCode: 'Base.556AmmoBox_60', gameName: '5.56 Ammo Crate (60)', gameCategory: 'Ammo', price: 2400, compareAtPrice: 2800, stock: 20, isDefault: true, quantity: 1, selections: { 'pack-size': '60-rounds' } },
        { name: '120 Rounds', sku: '556-CRATE-120', itemCode: 'Base.556AmmoBox_120', gameName: '5.56 Ammo Crate (120)', gameCategory: 'Ammo', price: 4400, compareAtPrice: 5200, stock: 14, quantity: 1, selections: { 'pack-size': '120-rounds' } },
      ],
    },
  ]

  const seededProductIds: string[] = []
  const variantIdsBySku = new Map<string, string>()
  const productIdsBySlug = new Map<string, string>()

  for (const productSpec of productSpecs) {
    const product = await prisma.storeProduct.upsert({
      where: {
        profileId_slug: {
          profileId,
          slug: productSpec.slug,
        },
      },
      update: {
        name: productSpec.name,
        summary: productSpec.summary,
        description: productSpec.description,
        overview: productSpec.overview,
        featureBullets: productSpec.featureBullets,
        specs: productSpec.specs,
        badge: productSpec.badge,
        accentColor: productSpec.accentColor,
        isFeatured: productSpec.isFeatured,
        isActive: true,
      },
      create: {
        profileId,
        name: productSpec.name,
        slug: productSpec.slug,
        summary: productSpec.summary,
        description: productSpec.description,
        overview: productSpec.overview,
        featureBullets: productSpec.featureBullets,
        specs: productSpec.specs,
        badge: productSpec.badge,
        accentColor: productSpec.accentColor,
        isFeatured: productSpec.isFeatured,
        isActive: true,
      },
    })

    seededProductIds.push(product.id)
    productIdsBySlug.set(productSpec.slug, product.id)

    await prisma.storeProductCategory.deleteMany({
      where: { productId: product.id },
    })
    await prisma.storeProductRecommendation.deleteMany({
      where: { sourceProductId: product.id },
    })
    await prisma.storeProductVariant.deleteMany({
      where: { productId: product.id },
    })
    await prisma.storeProductOptionGroup.deleteMany({
      where: { productId: product.id },
    })

    await prisma.storeProductCategory.createMany({
      data: productSpec.categorySlugs
        .map((categorySlug, index) => ({
          productId: product.id,
          categoryId: categoryIdsBySlug.get(categorySlug),
          sortOrder: index,
        }))
        .filter((link): link is { productId: string, categoryId: string, sortOrder: number } => Boolean(link.categoryId)),
    })

    const optionValueIds = new Map<string, string>()

    for (const [groupIndex, group] of productSpec.optionGroups.entries()) {
      const createdGroup = await prisma.storeProductOptionGroup.create({
        data: {
          productId: product.id,
          name: group.name,
          slug: group.slug,
          displayType: group.displayType,
          sortOrder: groupIndex,
        },
      })

      for (const [valueIndex, value] of group.values.entries()) {
        const createdValue = await prisma.storeProductOptionValue.create({
          data: {
            optionGroupId: createdGroup.id,
            label: value.label,
            slug: value.slug,
            colorHex: value.colorHex ?? null,
            sortOrder: valueIndex,
          },
        })

        optionValueIds.set(`${group.slug}:${value.slug}`, createdValue.id)
      }
    }

    for (const [variantIndex, variant] of productSpec.variants.entries()) {
      const createdVariant = await prisma.storeProductVariant.create({
        data: {
          productId: product.id,
          name: variant.name,
          sku: variant.sku,
          itemCode: variant.itemCode,
          gameName: variant.gameName,
          gameCategory: variant.gameCategory,
          price: variant.price,
          compareAtPrice: variant.compareAtPrice,
          quantity: variant.quantity ?? 1,
          stock: variant.stock,
          badge: variant.badge ?? null,
          isDefault: Boolean(variant.isDefault),
          isActive: true,
          sortOrder: variantIndex,
          selections: Object.keys(variant.selections).length > 0
            ? {
                create: Object.entries(variant.selections)
                  .map(([groupSlug, valueSlug]) => optionValueIds.get(`${groupSlug}:${valueSlug}`))
                  .filter((optionValueId): optionValueId is string => Boolean(optionValueId))
                  .map(optionValueId => ({ optionValueId })),
              }
            : undefined,
        },
      })

      variantIdsBySku.set(variant.sku, createdVariant.id)
    }
  }

  await prisma.storeProductRecommendation.deleteMany({
    where: {
      sourceProductId: {
        in: seededProductIds,
      },
    },
  })

  const recommendationSpecs = [
    ['m16-rifle', 'm16-magazine'],
    ['m16-rifle', '556-ammo-crate'],
  ]

  for (const [sourceSlug, targetSlug] of recommendationSpecs) {
    const sourceProductId = productIdsBySlug.get(sourceSlug)
    const targetProductId = productIdsBySlug.get(targetSlug)

    if (!sourceProductId || !targetProductId) {
      continue
    }

    await prisma.storeProductRecommendation.upsert({
      where: {
        sourceProductId_targetProductId: {
          sourceProductId,
          targetProductId,
        },
      },
      update: {},
      create: {
        sourceProductId,
        targetProductId,
        sortOrder: 0,
      },
    })
  }

  const bundleSpecs = [
    {
      name: 'M16 Starter Kit',
      slug: 'm16-starter-kit',
      summary: 'A ready-to-run rifle package with magazines and ammo in one discounted purchase.',
      description: 'Bundle pricing shows how to sell a complete weapon setup instead of leaving a high-value product alone.',
      badge: 'Starter Kit',
      accentColor: '#0f766e',
      price: 16400,
      compareAtPrice: 18800,
      items: [
        { sku: 'M16-RIFLE', quantity: 1 },
        { sku: 'M16-MAG', quantity: 2 },
        { sku: '556-CRATE-120', quantity: 1 },
      ],
    },
    {
      name: 'Patrol Kneepad Pair',
      slug: 'patrol-kneepad-pair',
      summary: 'Pre-built left and right kneepad pair for fast checkouts.',
      description: 'A bundle version of the configurable kneepad product for players who just want the complete set.',
      badge: 'Bundle',
      accentColor: '#b45309',
      price: 1450,
      compareAtPrice: 1800,
      items: [
        { sku: 'KPAD-L-DESERT', quantity: 1 },
        { sku: 'KPAD-R-DESERT', quantity: 1 },
      ],
    },
  ]

  for (const bundleSpec of bundleSpecs) {
    const bundle = await prisma.storeBundle.create({
      data: {
        profileId,
        name: bundleSpec.name,
        slug: bundleSpec.slug,
        summary: bundleSpec.summary,
        description: bundleSpec.description,
        badge: bundleSpec.badge,
        accentColor: bundleSpec.accentColor,
        price: bundleSpec.price,
        compareAtPrice: bundleSpec.compareAtPrice,
        isFeatured: true,
        isActive: true,
        metadata: {
          seeded: true,
          bundleKey: storeSlug(bundleSpec.name),
        },
      },
    })

    await prisma.storeBundleItem.createMany({
      data: bundleSpec.items
        .map((item, index) => ({
          bundleId: bundle.id,
          variantId: variantIdsBySku.get(item.sku),
          quantity: item.quantity,
          sortOrder: index,
        }))
        .filter((item): item is { bundleId: string, variantId: string, quantity: number, sortOrder: number } => Boolean(item.variantId)),
    })
  }
}

async function main() {
  const adminUsername = process.env.ADMIN_USERNAME || 'admin'
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@localhost'
  const adminPassword = process.env.ADMIN_PASSWORD || 'changeme'
  const serverName = process.env.SERVER_NAME || 'Default'

  const passwordHash = await hashPassword(adminPassword)

  await prisma.user.upsert({
    where: { username: adminUsername },
    update: {},
    create: {
      username: adminUsername,
      email: adminEmail,
      passwordHash,
      role: UserRole.ADMIN,
    },
  })

  console.log(`Admin user "${adminUsername}" seeded.`)

  // Create default server profile
  const profile = await prisma.serverProfile.upsert({
    where: { name: serverName },
    update: {},
    create: {
      name: serverName,
      isActive: true,
      servername: toServerSlug(serverName),
      gamePort: 16261,
      directPort: 16262,
      rconPort: 27015,
      mapName: 'Muldraugh, KY',
      maxPlayers: 16,
      pvp: true,
      difficulty: 'Normal',
    },
  })

  console.log(`Server profile "${serverName}" seeded.`)

  for (const listener of defaultTelemetryListeners) {
    await prisma.telemetryListener.upsert({
      where: {
        profileId_adapterKey: {
          profileId: profile.id,
          adapterKey: listener.adapterKey,
        },
      },
      update: {
        name: listener.name,
        eventKey: listener.eventKey,
        isEnabled: listener.isEnabled ?? true,
        config: listener.config,
      },
      create: {
        profileId: profile.id,
        adapterKey: listener.adapterKey,
        name: listener.name,
        eventKey: listener.eventKey,
        isEnabled: listener.isEnabled ?? true,
        config: listener.config,
      },
    })
  }

  for (const rule of defaultActionRules) {
    await prisma.actionRule.upsert({
      where: {
        id: `${profile.id}:${rule.name}`,
      },
      update: {
        name: rule.name,
        triggerKind: rule.triggerKind,
        triggerKey: rule.triggerKey,
        moneyAmount: rule.moneyAmount ?? 0,
        xpAmount: rule.xpAmount ?? 0,
        xpCategory: rule.xpCategory,
        xpCategoryAmount: rule.xpCategoryAmount ?? 0,
        config: rule.config,
      },
      create: {
        id: `${profile.id}:${rule.name}`,
        profileId: profile.id,
        name: rule.name,
        triggerKind: rule.triggerKind,
        triggerKey: rule.triggerKey,
        moneyAmount: rule.moneyAmount ?? 0,
        xpAmount: rule.xpAmount ?? 0,
        xpCategory: rule.xpCategory,
        xpCategoryAmount: rule.xpCategoryAmount ?? 0,
        config: rule.config,
      },
    })
  }

  await seedStoreCatalog(profile.id)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
