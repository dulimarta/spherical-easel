<script setup lang="ts">
defineProps<{ title: string, iconName:string, titleTwo?: string, iconNameTwo?:string, titleThree?:string, iconNameThree?:string
 }>();
</script>

<template>
  <div v-if="titleTwo==undefined"
  class="titleClass">
{{ title }}  <IconBase notInLine :iconName=iconName />
    <slot/>
  </div>
  <div v-else-if="titleThree==undefined" class="titleClass">
{{ title }}  <IconBase notInLine :iconName=iconName /> and {{ titleTwo }}  <IconBase notInLine :iconName=iconNameTwo />
  </div>
  <div v-else class="titleClass">
{{ title }}  <IconBase notInLine :iconName=iconName />, {{ titleTwo }}  <IconBase notInLine :iconName=iconNameTwo />, {{ titleThree }} <IconBase notInLine :iconName=iconNameThree />
  </div>
</template>

<style scoped>
.titleClass {
  color: #000000
}
/* div :deep([class*='language-']:before) {
  content: var(--toolTitle);
} */
</style>