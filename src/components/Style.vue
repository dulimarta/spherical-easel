<template>
  <transition name="slide-out"
    mode="out-in">
    <div v-if="!minified"
      key="full"
      style="height: 100%; overflow:auto"
      @mouseenter="setSelectTool"
      @mouseleave="saveStyleState">

      <v-divider></v-divider>

      <!-- Switches for show/hide label(s) and object(s)-->
      <v-card flat
        class="ma-0 pa-0">
        <v-card-text class="ma-0 pa-0">
          <v-container fluid
            class="ma-0 pa-0">
            <v-row no-gutters
              justify="center">
              <v-col cols="12"
                sm="4"
                md="4"
                class="ma-0 pl-0 pb-0 pt-0 pr-0">
                <v-switch v-model="allLabelsShowing"
                  @change="toggleLabelsShowing"
                  :label="$t('style.showLabels')"
                  color="primary"
                  hide-details
                  class="ma-0 pl-0 pb-0 pt-0 pr-0"
                  :disabled="!(this.selections.length > 0) || !allObjectsShowing">
                </v-switch>
              </v-col>
              <v-col cols="12"
                sm="4"
                md="4"
                class="ma-0 pl-0 pb-0 pt-0 pr-0">
                <v-switch v-model="allObjectsShowing"
                  @change="toggleObjectsShowing"
                  :label="$t('style.showObjects')"
                  color="primary"
                  hide-details
                  class="ma-0 pl-0 pb-0 pt-0 pr-0"
                  :disabled="!(this.selections.length > 0)"></v-switch>
              </v-col>
            </v-row>
          </v-container>
        </v-card-text>
      </v-card>

      <v-divider></v-divider>

      <!-- Type and number list of objects that are selected-->
      <div class="text-center">
        <v-chip v-for="item in
          selectedItemArray"
          :key="item.message"
          x-small>
          {{item}}
        </v-chip>
      </div>

      <!-- Nothing Selected Overlay-->
      <v-overlay absolute
        v-bind:value="!(this.selections.length > 0)"
        :opacity="0.8">
        <v-card class="mx-auto"
          max-width="344"
          outlined>
          <v-list-item three-line
            class="pb-0">
            <v-list-item-content class="pb-1">
              <div class="overline mb-2">
                {{ $t('style.NOSELECTION') }}
              </div>
              <v-list-item-title class="headline mb-1">
                {{$t('style.selectAnObject')}}
              </v-list-item-title>
              <v-list-item-subtitle>
                {{$t('style.closeOrSelect')}}
              </v-list-item-subtitle>
            </v-list-item-content>
          </v-list-item>

          <v-card-text class="pt-0">
            {{$t('style.toSelectObjects')}}
            <ul>
              <li>{{$t('style.selectionDirection1')}}
              </li>
              <li>{{$t('style.selectionDirection2')}}
              </li>
              <li> {{$t('style.selectionDirection3')}}
              </li>
              <li>{{$t('style.selectionDirection4')}} </li>
            </ul>
          </v-card-text>

          <v-card-actions>
            <template>
              <v-tooltip bottom
                :open-delay="toolTipOpenDelay"
                :close-delay="toolTipCloseDelay"
                max-width="400px">
                <template v-slot:activator="{ on }">
                  <v-btn v-on="on"
                    color="info"
                    v-on:click="$emit('toggle-style-panel')">
                    {{$t('style.closeStylingPanel')}}
                  </v-btn>
                </template>
                {{$t('style.noSelectionToolTip')}}
              </v-tooltip>
            </template>
          </v-card-actions>

        </v-card>

      </v-overlay>
      <v-expansion-panels v-model="activePanel">
        <v-expansion-panel v-for="(p, idx) in panels"
          :key="idx">
          <v-expansion-panel-header color="blue lighten-3"
            :key="`header${idx}`"
            class="body-1 font-weight-bold ps-6 pe-0 pt-n4 pb-n4 pm-0">

            {{ $t(p.i18n_key) }}

          </v-expansion-panel-header>
          <v-expansion-panel-content :color="panelBackgroundColor(idx)"
            :key="`content${idx}`">
            <component :is="p.component"
              :panel="p.panel"
              :active-panel="activePanel"
              @hook:mounted="addPanelMounted(idx)">
            </component>
          </v-expansion-panel-content>
        </v-expansion-panel>
      </v-expansion-panels>
    </div>
    <div v-else
      id="mini-icons"
      key="partial">
      <v-icon v-on:click="$emit('toggle-style-panel')">mdi-palette</v-icon>
    </div>
  </transition>
</template>

<script lang="ts">
import Vue from "vue";
import Component from "vue-class-component";
import BasicFrontBackStyle from "@/components/BasicFrontBackStyle.vue";
import { Watch, Prop } from "vue-property-decorator";
import EventBus from "../eventHandlers/EventBus";
import SETTINGS from "@/global-settings";
import { StyleEditPanels } from "@/types/Styles";
import { hslaColorType, AppState, Labelable } from "@/types";
import { SENodule } from "@/models/SENodule";
import { State } from "vuex-class";
import { CommandGroup } from "@/commands/CommandGroup";
import { SetNoduleDisplayCommand } from "@/commands/SetNoduleDisplayCommand";
import Label from "@/plottables/Label";
import { SELabel } from "@/models/SELabel";

@Component({ components: { BasicFrontBackStyle } })
export default class Style extends Vue {
  @Prop()
  readonly minified!: boolean;

  @State((s: AppState) => s.selections)
  readonly selections!: SENodule[];

  readonly store = this.$store.direct;

  readonly toolTipOpenDelay = SETTINGS.toolTip.openDelay;
  readonly toolTipCloseDelay = SETTINGS.toolTip.closeDelay;

  private activePanel: number | undefined = 0; // Default selection is the Label panel

  private allLabelsShowing = false;
  private allObjectsShowing = false;

  // A string list of the number of items and type of them in the current selection
  private selectedItemArray: string[] = [];

  // A list of the mount panels
  private mountedPanels: number[] = [];

  mounted(): void {
    EventBus.listen("update-all-labels-showing", this.allLabelsShowingCheck);
    EventBus.listen("update-all-objects-showing", this.allObjectsShowingCheck);
  }

  @Watch("minified")
  closeAllPanels(): void {
    console.log("minified");
    this.activePanel = undefined;
    // If the user has been styling objects and then, without selecting new objects, or deactivating selection the style state should be saved.
    EventBus.fire("save-style-state", {});
  }

  @Watch("selections")
  private allLabelsShowingCheck(): void {
    this.allLabelsShowing = this.selections.every(node => {
      if (node.isLabelable()) {
        return ((node as unknown) as Labelable).label!.showing;
      } else {
        return true;
      }
    });
  }
  @Watch("selections")
  private allObjectsShowingCheck(): void {
    this.allObjectsShowing = this.selections.every(node => {
      return node.showing === true;
    });
  }

  //Convert the selections into a short list of the type (and number) of the objects in the selection
  @Watch("selections")
  private updateSelectedItemArray(): void {
    const tempArray: string[] = [];
    this.selections.forEach(node => tempArray.push(node.name));
    const elementListPural = [
      "Points",
      "Lines",
      "Segments",
      "Circles",
      "Labels"
    ];
    const elementListSingular = ["Point", "Line", "Segment", "Circle", "Label"];
    const firstPartList = ["P", "Li", "Ls", "C", "La"];
    const countList: any[] = [];
    firstPartList.forEach((str, index) => {
      let count = 0;
      tempArray.forEach(name => {
        if (name.startsWith(str)) {
          count++;
        }
      });
      countList.push(count);
    });

    this.selectedItemArray = countList
      .map((num, index) => {
        if (num > 1) {
          return elementListPural[index] + " (x" + String(num) + ")";
        } else if (num === 1) {
          return elementListSingular[index];
        } else {
          return "0";
        }
      })
      .filter(str => !str.startsWith("0"));
  }

  // The order of these panels *must* match the order of the StyleEditPanels in Style.ts
  private readonly panels = [
    {
      i18n_key: "style.labelStyle",
      component: () => import("@/components/BasicFrontBackStyle.vue"),
      panel: StyleEditPanels.Label
    },
    {
      i18n_key: "style.foregroundStyle",
      component: () => import("@/components/BasicFrontBackStyle.vue"),
      panel: StyleEditPanels.Front
    },
    {
      i18n_key: "style.backgroundStyle",
      component: () => import("@/components/BasicFrontBackStyle.vue"),
      panel: StyleEditPanels.Back
    },
    {
      i18n_key: "style.advancedStyle",
      component: () => import("@/components/AdvancedStyle.vue"),
      panel: StyleEditPanels.Advanced
    }
  ];

  //When ever the mouse enters the style panel, set the active tool to select because it is like that the
  // user is going to style objects.
  private setSelectTool(): void {
    EventBus.fire("set-action-mode-to-select-tool", {});
  }

  //When ever the mouse leaves the style panel, save the state because it is likly that the user is done styling
  private saveStyleState(): void {
    EventBus.fire("save-style-state", {});
  }

  addPanelMounted(panelNum: number): void {
    console.log("mounting panel ", panelNum);
    if (this.mountedPanels.findIndex(i => i === panelNum) === -1) {
      this.mountedPanels.push(panelNum);
    }
  }

  panelBackgroundColor(idx: number): string {
    if (idx === 1) {
      return "grey lighten-2"; //used to be different but I changed my mind
    } else {
      return "grey lighten-2";
    }
  }

  toggleLabelsShowing(): void {
    //If we toggle-label-visbility with out opening the label panel (i.e. the mount method won't have run)
    // then EventBus.fire("toggle-label-visibility", {}); does nothing,
    // so we have to check to see if the label panel is mounted and use either SetNoduleDisplayCommand or StyleNoduleCommand (used in toggle-label-visibility )

    //if (this.mountedPanels.findIndex(i => i === 0) === -1) {
    if (this.mountedPanels.length === 0) {
      // no panels are mounted
      const toggleLabelDisplayCommandGroup = new CommandGroup();
      this.selections.forEach(node => {
        if (node.isLabelable()) {
          toggleLabelDisplayCommandGroup.addCommand(
            new SetNoduleDisplayCommand(
              ((node as unknown) as Labelable).label!,
              this.allLabelsShowing
            )
          );
        }
      });
      toggleLabelDisplayCommandGroup.execute();
    } else {
      console.log("toggle label from style.vue - label panel mounted");
      // at least one panel is mounted
      EventBus.fire("toggle-label-visibility", {
        mountedPanel: this.mountedPanels[0]
      });
    }
  }

  toggleObjectsShowing(): void {
    //if (this.mountedPanels.findIndex(i => i === 0) === -1) {
    if (this.mountedPanels.length === 0) {
      // no panels are mounted
      const toggleObjectDisplayCommandGroup = new CommandGroup();
      this.selections.forEach(node => {
        toggleObjectDisplayCommandGroup.addCommand(
          new SetNoduleDisplayCommand(node, this.allObjectsShowing)
        );
      });
      toggleObjectDisplayCommandGroup.execute();
    } else {
      console.log("toggle objects from style.vue - label panel mounted");
      // at least one panel is mounted
      EventBus.fire("toggle-object-visibility", {
        mountedPanel: this.mountedPanels[0]
      });
    }
    // update the this.allLabelsShowing varaible, because hiding an object hide the label (depending on
    //  SETTINGS.hideObjectHidesLabel) and similarly showing an object shows the label (depending
    //  SETTIGNS.showObjectShowsLabel)
    this.allLabelsShowingCheck();
  }
}
</script>

<style scoped>
#mini-icons {
  display: flex;
  flex-direction: column;
  height: 80vh;
  align-items: center;
  justify-content: center;
}

.slide-out-enter-active,
.slide-out-leave-active {
  transition-property: all;
  transition-duration: 250ms;
  transition-timing-function: ease;
}

.slide-out-enter,
.slide-out-leave-to {
  transform: translateX(200%);
}
</style>
