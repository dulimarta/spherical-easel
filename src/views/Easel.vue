<template>
  <split-pane
    split="vertical"
    :min-percent="5"
    :max-percent="25"
    :default-percent="toolboxMinified ? 5 : 30"
    @resize="dividerMoved"
  >
    <template slot="paneL">
      <div>
        <v-btn icon @click="toolboxMinified = !toolboxMinified">
          <v-icon v-if="toolboxMinified">mdi-arrow-right</v-icon>
          <v-icon v-else>mdi-arrow-left</v-icon>
        </v-btn>
      </div>

      <toolbox :minified="toolboxMinified"></toolbox>
    </template>
    <template slot="paneR">
      <v-container fluid ref="rightPanel">
        <v-row>
          <v-col cols="12">Buttons</v-col>
          <v-col cols="12">
            <v-row justify="center" class="pb-1">
              <v-responsive
                :aspect-ratio="1"
                :max-height="maxCanvasSize"
                :max-width="maxCanvasSize"
                ref="resp"
                class="yellow"
              >
                <div :style="{ height: '100%' }" ref="canvasContent"></div>
              </v-responsive>
            </v-row>
          </v-col>
        </v-row>
      </v-container>
    </template>
  </split-pane>
</template>

<script lang="ts">
import VueComponent from "vue";
import { Vue } from "vue-property-decorator";
import SplitPane from "vue-splitpane";
import Component from "vue-class-component";
import Toolbox from "@/components/ToolBox.vue";

@Component({ components: { SplitPane, Toolbox } })
export default class Easel extends Vue {
  private availHeight = 0;
  private maxCanvasSize = 0;
  private leftPanePercentage = 30;
  private toolboxMinified = false;
  mounted(): void {
    this.adjustSize();
    window.addEventListener("resize", this.onWindowResized);
  }

  private adjustSize(): void {
    this.availHeight =
      window.innerHeight -
      this.$vuetify.application.footer -
      this.$vuetify.application.top;
    console.debug(
      `App top ${this.$vuetify.application.top},` +
        `Footer ${this.$vuetify.application.footer}`
    );
    const tmp = this.$refs.resp;
    let canvasPanel: HTMLElement;
    if (tmp instanceof VueComponent)
      canvasPanel = (tmp as VueComponent).$el as HTMLElement;
    else canvasPanel = tmp as HTMLElement;
    const rightBox = canvasPanel.getBoundingClientRect();
    this.maxCanvasSize = this.availHeight - rightBox.top;
    console.debug(
      `Available height ${this.availHeight.toFixed(
        2
      )} Canvas ${this.maxCanvasSize.toFixed(2)}`
    );
  }

  dividerMoved(leftPercentage: number): void {
    // this.adjustSize();
    const canvasContent = this.$refs.canvasContent as HTMLElement;
    const box = canvasContent.getBoundingClientRect();
    console.debug("Canvas size", box.height, box.width);
  }

  onWindowResized(): void {
    this.adjustSize();
  }
}
</script>

<style scoped>
#content {
  border: 2px dashed darkcyan;
}
</style>
