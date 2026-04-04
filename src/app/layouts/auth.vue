<script setup lang="ts">
import { Skull } from 'lucide-vue-next'
import { Toaster } from '@/components/ui/sonner'
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
          <div class="w-full max-w-sm">
            <slot />
          </div>
        </div>
      </div>
      <div class="bg-muted relative hidden overflow-hidden lg:block">
        <img
          src="/sidebar.webp"
          alt="Project Zomboid"
          class="absolute inset-0 h-full w-full object-cover"
        >
      </div>
    </div>
    <Toaster rich-colors />
  </div>
</template>
