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
                  :disabled="!(this.selectedSENodules.length > 0) || !allObjectsShowing">
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
                  :disabled="!(this.selectedSENodules.length > 0)">
                </v-switch>
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
      <OverlayWithFixButton v-if="!(this.selectedSENodules.length > 0)"
        z-index="100"
        i18n-title-line="style.selectAnObject"
        i18n-subtitle-line="style.closeOrSelect"
        i18n-list-title="style.toSelectObjects"
        :i18n-list-items="['style.selectionDirection1','style.selectionDirection2','style.selectionDirection3','style.selectionDirection4']"
        i18n-button-label="style.closeStylingPanel"
        i18n-button-tool-tip="style.noSelectionToolTip"
        @click="$emit('toggle-style-panel')">
      </OverlayWithFixButton>

      <v-expansion-panels v-model="activePanel">
        <v-expansion-panel v-for="(p, idx) in panels"
          :key="idx">
          <v-expansion-panel-header color="blue lighten-3"
            :key="`header${idx}`"
            class="body-1 text-h6 ps-6 pe-0 pt-n4 pb-n4 pm-0">

            {{ $t(p.i18n_key) }}

          </v-expansion-panel-header>
          <v-expansion-panel-content :color="panelBackgroundColor(idx)"
            :key="`content${idx}`">
            <component :is="p.component"
              :panel="p.panel"
              :active-panel="activePanel">
            </component>
          </v-expansion-panel-content>
        </v-expansion-panel>
      </v-expansion-panels>

    </div>
    <div v-else
      id="mini-icons"
      key="partial">
      <v-icon v-on:click="$emit('toggle-style-panel')">mdi-palette
      </v-icon>
    </div>
  </transition>

</template>

<script lang="ts">
import Vue from "vue";
import Component from "vue-class-component";
import BasicFrontBackStyle from "@/components/FrontBackStyle.vue";
import OverlayWithFixButton from "@/components/OverlayWithFixButton.vue";
import { Watch, Prop } from "vue-property-decorator";
import EventBus from "../eventHandlers/EventBus";
import SETTINGS from "@/global-settings";
import { StyleEditPanels } from "@/types/Styles";
import { hslaColorType, AppState, Labelable } from "@/types";
import { SENodule } from "@/models/SENodule";
import { CommandGroup } from "@/commands/CommandGroup";
import { SetNoduleDisplayCommand } from "@/commands/SetNoduleDisplayCommand";
import { namespace } from "vuex-class";
import i18n from "../i18n";

const SE = namespace("se");

@Component({ components: { BasicFrontBackStyle, OverlayWithFixButton } })
export default class Style extends Vue {
  @Prop()
  readonly minified!: boolean;

  @SE.State((s: AppState) => s.selectedSENodules)
  readonly selectedSENodules!: SENodule[];

  readonly toolTipOpenDelay = SETTINGS.toolTip.openDelay;
  readonly toolTipCloseDelay = SETTINGS.toolTip.closeDelay;

  private activePanel: number | undefined = 0; // Default selection is the Label panel

  private allLabelsShowing = false;
  private allObjectsShowing = false;

  // A string list of the number of items and type of them in the current selection
  private selectedItemArray: string[] = [];

  mounted(): void {
    EventBus.listen("update-all-labels-showing", this.allLabelsShowingCheck);
    EventBus.listen("update-all-objects-showing", this.allObjectsShowingCheck);
    EventBus.listen(
      "toggle-object-visibility",
      this.toggleObjectsShowing.bind(this)
    );
    EventBus.listen(
      "toggle-label-visibility",
      this.toggleLabelsShowing.bind(this)
    );
  }

  @Watch("minified")
  closeAllPanels(): void {
    this.activePanel = undefined;
    // If the user has been styling objects and then, without selecting new objects, or deactivating selection the style state should be saved.
    EventBus.fire("save-style-state", {});
  }

  @Watch("selectedSENodules")
  private allLabelsShowingCheck(): void {
    // console.log("Style All Labels: onSelectionChanged");

    this.allLabelsShowing = this.selectedSENodules.every(node => {
      if (node.isLabelable()) {
        return ((node as unknown) as Labelable).label!.showing;
      } else {
        return true;
      }
    });
  }
  @Watch("selectedSENodules")
  private allObjectsShowingCheck(): void {
    // console.log("Style All Objects: onSelectionChanged");
    this.allObjectsShowing = this.selectedSENodules.every(node => {
      return node.showing === true;
    });
  }

  //Convert the selections into a short list of the type (and number) of the objects in the selection
  @Watch("selectedSENodules")
  private updateSelectedItemArray(): void {
    // console.log("Style update selected item array: onSelectionChanged");

    const tempArray: string[] = [];
    const alreadyCounted: boolean[] = []; // records if the tempArray item has already been counted (helps avoid one tempArray item being counted multiple times -- make sure the order of the search dicated by firstPartialList is correct)
    this.selectedSENodules.forEach(node => {
      tempArray.push(node.name);
      alreadyCounted.push(false);
    });
    const elementListi18nKeys = [
      "style.parametric",
      "style.polygon",
      "style.point",
      "style.line",
      "style.segment",
      "style.circle",
      "style.label",
      "style.angleMarker",
      "style.ellipse"
    ];
    const firstPartList = ["Pa", "Po", "P", "Li", "Ls", "C", "La", "M", "E"]; // The *internal* names of the objects start with these strings (the oder must match the order of the signular/pural i18n keys)
    const countList: number[] = [];
    firstPartList.forEach(str => {
      let count = 0;
      tempArray.forEach((name, ind) => {
        if (name.startsWith(str) && !alreadyCounted[ind]) {
          alreadyCounted[ind] = true;
          count++;
        }
      });
      countList.push(count);
    });

    this.selectedItemArray = countList
      .map((num, index) => {
        if (num > 1) {
          return String(
            i18n.tc(elementListi18nKeys[index], num, { count: num })
          );
        } else if (num === 1) {
          return String(i18n.tc(elementListi18nKeys[index], 1));
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
      component: () => import("@/components/LabelStyle.vue"),
      panel: StyleEditPanels.Label
    },
    {
      i18n_key: "style.foregroundStyle",
      component: () => import("@/components/FrontBackStyle.vue"),
      panel: StyleEditPanels.Front
    },
    {
      i18n_key: "style.backgroundStyle",
      component: () => import("@/components/FrontBackStyle.vue"),
      panel: StyleEditPanels.Back
    },
    {
      i18n_key: "style.advancedStyle",
      component: () => import("@/components/AdvancedStyle.vue"),
      panel: StyleEditPanels.Advanced
    }
  ];

  //When ever the mouse enters the style panel, set the active tool to select because it is likely that the
  // user is going to style objects.
  private setSelectTool(): void {
    EventBus.fire("set-action-mode-to-select-tool", {});
  }

  //When ever the mouse leaves the style panel, save the state because it is likely that the user is done styling
  private saveStyleState(): void {
    EventBus.fire("save-style-state", {});
  }

  panelBackgroundColor(idx: number): string {
    if (idx === 1) {
      return "grey lighten-2"; //used to be different but I changed my mind
    } else {
      return "grey lighten-2";
    }
  }

  toggleLabelsShowing(fromPanel: unknown): void {
    // if this method is being called from a panel, then we need to toogle allLabelsShowing
    // if this method is being called from the html (i.e. from the switch) then all LabelsShowing is
    //  automatically toggled
    if ((fromPanel as any).fromPanel !== undefined) {
      this.allLabelsShowing = !this.allLabelsShowing;
    }
    const toggleLabelDisplayCommandGroup = new CommandGroup();
    this.selectedSENodules.forEach(node => {
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

    // Showing the labels when the objects are not showing, shows the objects
    if (!this.allObjectsShowing && this.allLabelsShowing) {
      this.toggleObjectsShowing({ fromPanel: true });
    }
  }

  toggleObjectsShowing(fromPanel: unknown): void {
    // if this method is being called from a panel, then we need to toogle allObjectssShowing
    // if this method is being called from the html (i.e. from the switch) then allObjectsShowing is
    //  automatically toggled
    if ((fromPanel as any).fromPanel !== undefined) {
      this.allObjectsShowing = !this.allObjectsShowing;
    }

    const toggleObjectDisplayCommandGroup = new CommandGroup();
    this.selectedSENodules.forEach(node => {
      toggleObjectDisplayCommandGroup.addCommand(
        new SetNoduleDisplayCommand(node, this.allObjectsShowing)
      );
    });
    toggleObjectDisplayCommandGroup.execute();

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
