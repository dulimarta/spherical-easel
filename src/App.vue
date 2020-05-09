<template>
  <v-app app>
    <!--  Use the "cliopped" attribute to keep the navigation drawer 
    below the app toolbar-->
    <v-navigation-drawer app clipped permanent color="accent"
      :mini-variant="minified">
      <div id="leftDrawer">

        <!-- pa-4: padding all 16px -->
        <div>
          <h3 class="body-1 font-weight-bold">Basic Tools</h3>
          <!-- mr-2: margin right 8 px -->
          <v-btn-toggle v-model="editMode" @change="switchEditMode"
            class="mr-2"
            v-bind:style="{flexDirection: minified?'column':'row'}">
            <v-btn value="none">
              <v-icon>mdi-cursor-pointer</v-icon>
            </v-btn>
            <v-tooltip bottom>
              <template v-slot:activator={on}>
                <v-btn value="move" v-on="on">
                  <v-icon>mdi-cursor-move</v-icon>
                </v-btn>
              </template>
              <span>Move object</span>
            </v-tooltip>
            <v-tooltip bottom>
              <template v-slot:activator={on}>
                <v-btn value="point" v-on="on">
                  <v-icon>mdi-vector-point</v-icon>
                </v-btn>
              </template>
              <span>Insert point</span>
            </v-tooltip>
            <v-tooltip bottom>
              <template v-slot:activator={on}>
                <v-btn value="line" v-on="on">
                  <v-icon>mdi-vector-line</v-icon>
                </v-btn>
              </template>
              <span>Insert line</span>
            </v-tooltip>
            <v-tooltip bottom>
              <template v-slot:activator={on}>
                <v-btn value="segment" v-on="on">
                  <v-icon>mdi-vector-radius</v-icon>
                </v-btn>
              </template>
              <span>Insert segment</span>
            </v-tooltip>
            <v-tooltip bottom>
              <template v-slot:activator={on}>
                <v-btn value="circle" v-on="on">
                  <v-icon>mdi-vector-circle-variant</v-icon>
                </v-btn>
              </template>
              <span>Insert circle</span>
            </v-tooltip>
          </v-btn-toggle>
          <h3 class="body-1 font-weight-bold">Edit Tools</h3>
          <v-btn-toggle
            v-bind:style="{flexDirection: minified?'column':'row'}">
            <v-tooltip bottom>
              <template v-slot:activator={on}>
                <v-btn @click="undoEdit" v-on="on">
                  <v-icon>mdi-undo</v-icon>
                </v-btn>
              </template>
              <span>Undo last action</span>
            </v-tooltip>
            <v-tooltip bottom>
              <template v-slot:activator={on}>
                <v-btn @click="redoAction" v-on="on">
                  <v-icon>mdi-redo</v-icon>
                </v-btn>
              </template>
              <span>Redo action</span>
            </v-tooltip>
          </v-btn-toggle>
          <div v-show="!minified">
            <h3 class="body-1 font-weight-bold">Key Shortcut</h3>
            <ul>
              <li>"R": reset sphere orientation</li>
            </ul>
          </div>
        </div>
        <v-btn @click="minified = !minified">
          <v-icon v-if="minified">mdi-arrow-expand-right</v-icon>
          <v-icon v-else>mdi-arrow-expand-left</v-icon>
        </v-btn>
      </div>
    </v-navigation-drawer>
    <v-navigation-drawer app permanent right clipped>
      <!-- <ObjectTree :scene="sphere" /> -->
    </v-navigation-drawer>
    <!-- the "clipped-left" attribute works together with 
    the "clipped" attr of the nav drawer -->
    <v-app-bar app color="primary" dark clipped-left clipped-right>
      <div class="d-flex align-center">
        <v-img alt="Vuetify Logo" class="shrink mr-2" contain
          src="https://cdn.vuetifyjs.com/images/logos/vuetify-logo-dark.png"
          transition="scale-transition" width="40" />

        <!--v-img alt="Vuetify Name" class="shrink mt-1 hidden-sm-and-down"
          contain min-width="100"
          src="https://cdn.vuetifyjs.com/images/logos/vuetify-name-dark.png"
          width="100" /-->
        Spherical Easel 2.0
      </div>

      <v-spacer></v-spacer>
    </v-app-bar>

    <v-content>

      <Easel :renderer="renderer" :canvas="canvas">
      </Easel>

    </v-content>
  </v-app>
</template>

<script lang="ts">
import Vue from "vue";
import Easel from "@/components/Easel.vue";
import ObjectTree from "@/components/ObjectTree.vue"
import { Command } from "@/commands/Comnand";
// import { mapState } from 'vuex';
import { WebGLRenderer } from 'three';
import Component from 'vue-class-component';
import { Inject } from 'vue-property-decorator';
// import { State } from 'vuex-class';

@Component({
  components: {
    Easel, ObjectTree
  }
})
export default class App extends Vue {
  private editMode = "none";
  private minified = true;

  // Use dependency injection to let us mock the renderer
  // with a fake implementation during testing
  @Inject()
  private renderer!: WebGLRenderer;

  private canvas: HTMLCanvasElement;

  constructor() {
    super();
    this.canvas = this.renderer.domElement;
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.setClearColor(0xffffff);
  }


  switchEditMode() {
    this.$store.commit("setEditMode", this.editMode);
  }
  undoEdit() {
    Command.undo();
  }
  redoAction() {
    Command.redo();
  }
  // cantUndo() { return Command.canUndo() === false },
  // cantRedo: () => !Command.canRedo(),
}

</script>
<style lang="scss" scoped>
#leftDrawer {
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  :last-child {
    align-self: flex-end;
  }
}
.v-btn-toggle {
  flex-wrap: wrap;
}
</style>
