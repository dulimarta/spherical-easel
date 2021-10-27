<template>
  <v-icon :size="iconSizeValue">{{iconName}}</v-icon>
</template>

<script lang='ts'>
import SETTINGS from "../../../src/global-settings";
import { ActionMode } from "../../../src/types/index";
import { Prop, Component, Vue } from "vue-property-decorator";

@Component({})
export default class MDIIconBase extends Vue {
  @Prop() readonly iconName!: ActionMode;
  @Prop() readonly iconSize?: number;

  private iconSizeValue = SETTINGS.icons.defaultIconSize;

  mounted() {
    this.iconSizeValue = this.iconSize ?? SETTINGS.icons.defaultIconSize; // the default size
  }
}
</script>

<style scoped>
@import "https://cdn.jsdelivr.net/npm/@mdi/font@latest/css/materialdesignicons.min.css";
</style>
