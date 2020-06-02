<template>
  <split-pane
    split="vertical"
    :min-percent="5"
    :max-percent="25"
    :default-percent="20"
    @resize="dividerMoved"
  >
    <template slot="paneL">
      <toolbox></toolbox>
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
                <div :style="{ height: '100%' }" ref="box"></div>
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
  mounted(): void {
    this.adjustSize();
    window.addEventListener("resize", this.onWindowResized);
  }

  private adjustSize(): void {
    this.availHeight =
      window.innerHeight -
      this.$vuetify.application.footer -
      this.$vuetify.application.top;
    const tmp = this.$refs.resp;
    let canvasPanel: HTMLElement;
    if (tmp instanceof VueComponent)
      canvasPanel = (tmp as VueComponent).$el as HTMLElement;
    else canvasPanel = tmp as HTMLElement;
    const rightBox = canvasPanel.getBoundingClientRect();
    this.maxCanvasSize = this.availHeight - rightBox.top;
  }

  dividerMoved(leftPercentage: number): void {
    this.adjustSize();
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
