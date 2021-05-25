<template>
  <div>
    <slot name="activator={on}"></slot>
    <slot></slot>
  </div>
</template>

<script lang="ts">
export default {
  data: (): unknown => ({
    on: true
  })
};
</script>

<style lang="scss" scoped>
</style>