export const steamBuildValues = ['public', 'unstable'] as const

export type SteamBuild = typeof steamBuildValues[number]

export const steamBuildOptions: Array<{
  value: SteamBuild
  label: string
  description: string
}> = [
  {
    value: 'public',
    label: 'Stable',
    description: 'Use the public Project Zomboid branch.',
  },
  {
    value: 'unstable',
    label: 'Unstable',
    description: 'Use the unstable Project Zomboid branch for preview builds.',
  },
]