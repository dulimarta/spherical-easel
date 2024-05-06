<script setup lang="ts">
defineProps<{ title: string, iconName:string
 }>();
</script>

<template>
  <div class="titleClass">
{{ title }}  <IconBase notInLine :iconName=iconName />
    <slot />
  </div>
</template>

<style scoped>
.titleClass {
  color: #dcc110
}
/* div :deep([class*='language-']:before) {
  content: var(--toolTitle);
} */
</style>