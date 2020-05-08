<template>
  <div>
    <slot name="activator={on}"></slot>
    <p>********</p>
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