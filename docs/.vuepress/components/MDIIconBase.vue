<template>
  <v-icon :size="iconSize">{{iconName}}</v-icon>
</template>

<script>
export default {
  // kebab-case translates to KebabCase
  // So tikz-picture translates to TikzPicture
  // And tik-z-picture translates to TikZPicture
  name: "m-d-i-icon-base",
  props: {
    iconName: "",
    iconSize: ""
  },
  data() {
    return {};
  }
};
</script>

<style scoped>
@import "https://cdn.jsdelivr.net/npm/@mdi/font@latest/css/materialdesignicons.min.css";
</style>
