<template>
  <div>
    <slot name="activator={on}"></slot>
    <slot></slot>
  </div>
</template>

<script>
export default {
  data: () => ({
    on: true
  })
};
</script>

<style lang="scss" scoped>
</style>