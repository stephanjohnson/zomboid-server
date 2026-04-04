import * as v from 'valibot'

const QuerySchema = v.object({
  profileId: v.optional(v.string()),
})

export default defineEventHandler(async (event) => {
  const { profileId } = await getValidatedQuery(event, v.parser(QuerySchema))
  const profile = await resolveStoreProfile(profileId)
  const slug = getRouterParam(event, 'slug')

  if (!slug) {
    throw createError({ statusCode: 400, message: 'Bundle slug is required' })
  }

  const bundle = await prisma.storeBundle.findFirst({
    where: {
      profileId: profile.id,
      slug,
      isActive: true,
    },
    include: {
      items: {
        include: {
          variant: {
            include: {
              product: true,
            },
          },
        },
      },
    },
  })

  if (!bundle) {
    throw createError({ statusCode: 404, message: 'Bundle not found' })
  }

  return {
    profile: {
      id: profile.id,
      name: profile.name,
    },
    bundle: mapStoreBundleSummary(bundle),
  }
})
