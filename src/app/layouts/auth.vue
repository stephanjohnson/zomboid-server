<script setup lang="ts">
import { Skull } from 'lucide-vue-next'
import { Toaster } from '@/components/ui/sonner'

const route = useRoute()

const contentWidthClass = computed(() => {
  return route.path === '/onboarding'
    ? 'max-w-sm md:max-w-xl lg:max-w-2xl'
    : 'max-w-sm'
})
</script>

<template>
  <div>
    <NuxtLoadingIndicator color="var(--color-primary)" />
    <div class="grid min-h-screen lg:grid-cols-2">
      <div class="flex flex-col gap-4 p-6 md:p-10">
        <div class="flex justify-center gap-2 md:justify-start">
          <a href="#" class="flex items-center gap-2 font-medium">
            <div class="bg-primary text-primary-foreground flex size-6 items-center justify-center rounded-md">
              <Skull class="size-4" />
            </div>
            Zomboid Server Manager
          </a>
        </div>
        <div class="flex flex-1 items-center justify-center">
          <div class="w-full" :class="contentWidthClass">
            <slot />
          </div>
        </div>
      </div>
      <div class="bg-muted relative hidden overflow-hidden lg:block">
        <img
          src="/sidebar.jpg"
          alt="Project Zomboid"
          class="absolute inset-0 h-full w-full object-cover"
        >
        <div class="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
        <div class="absolute inset-0 flex items-end justify-end p-8">
          <img
            src="/logo.png"
            alt="Logo"
            class="floating-logo w-64 drop-shadow-2xl"
          >
        </div>
      </div>
    </div>
    <Toaster rich-colors />
  </div>
</template>

<style scoped>
.floating-logo {
  animation: float 6s ease-in-out infinite;
}

@keyframes float {
  0%, 100% {
    transform: translateY(0) rotate(0deg);
  }
  25% {
    transform: translateY(-12px) rotate(1deg);
  }
  50% {
    transform: translateY(-6px) rotate(-1deg);
  }
  75% {
    transform: translateY(-14px) rotate(0.5deg);
  }
}
</style>
