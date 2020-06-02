<template>
  <v-container id="leftnav" fluid>
    <!-- These the navigation arrows TODO: I would like these to be in the same row as the
        tabs-->
    <!-- This the not minimized left drawer containing two tabs -->
    <div v-if="!minified">
      <!-- Two tabs set up TODO: fix the behavior of the tabs-->
      <v-tabs v-model="activeLeftDrawerTab" centered grow>
        <v-tooltip
          bottom
          :open-delay="toolTipOpenDelay"
          :close-delay="toolTipCloseDelay"
        >
          <template v-slot:activator="{ on }">
            <v-tab class="mt-3" href="#toolListTab" v-on="on">
              <v-icon left>mdi-calculator</v-icon>
            </v-tab>
          </template>
          <span>{{ $t("main.ToolsTabToolTip") }}</span>
        </v-tooltip>

        <v-tooltip
          bottom
          :open-delay="toolTipOpenDelay"
          :close-delay="toolTipCloseDelay"
        >
          <template v-slot:activator="{ on }">
            <v-tab class="mt-3" href="#objectListTab" v-on="on">
              <v-icon left>mdi-format-list-bulleted</v-icon>
            </v-tab>
          </template>
          <span>{{ $t("main.ObjectsTabToolTip") }}</span>
        </v-tooltip>

        <v-tab-item value="toolListTab">
          <ToolButtons></ToolButtons>
        </v-tab-item>
        <v-tab-item value="objectListTab">
          <!--ObjectTree :scene="canvas">
              </ObjectTree-->
        </v-tab-item>
      </v-tabs>
    </div>
    <div v-else id="mini-icons">
      <v-icon>mdi-calculator</v-icon>
      <v-icon>mdi-format-list-bulleted</v-icon>
    </div>
  </v-container>
</template>

<script lang="ts">
import Vue from "vue";
import { Component, Prop } from "vue-property-decorator";
import ToolButtons from "@/components/ToolButtons.vue";
import SETTINGS from "@/global-settings";

@Component({ components: { ToolButtons } })
export default class Toolbox extends Vue {
  @Prop()
  readonly minified!: boolean;

  private leftDrawerMinified = false;
  /* Copy global setting to local variable */
  private toolTipOpenDelay = SETTINGS.toolTip.openDelay;
  private toolTipCloseDelay = SETTINGS.toolTip.closeDelay;
  private activeLeftDrawerTab = "toolListTab";
}
</script>

<style scoped>
#mini-icons {
  height: 80vh;
  display: flex;
  flex-direction: column;
  flex-grow: 1;
  justify-content: center;
}
</style>
