interface OnboardingStatus {
  hasAdmin: boolean
  hasProfile: boolean
  isComplete: boolean
}

export function useOnboardingStatus() {
  const status = useState<OnboardingStatus | null>('onboarding-status', () => null)

  async function fetchStatus(force = false) {
    if (!status.value || force) {
      status.value = await $fetch('/api/onboarding/status')
    }

    return status.value
  }

  return {
    status: readonly(status),
    fetchStatus,
  }
}