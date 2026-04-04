<script setup lang="ts">
const auth = useAuth()
</script>

<template>
  <div class="min-h-screen bg-background">
    <div class="flex">
      <!-- Sidebar -->
      <AppSidebar />

      <!-- Main content -->
      <main class="flex-1 p-6">
        <slot />
      </main>
    </div>
  </div>
</template>
