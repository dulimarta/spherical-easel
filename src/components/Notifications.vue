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

      <v-expansion-panels v-model="activePanel">

      </v-expansion-panels>

    </div>
   <v-btn v-else
      v-on:click="$emit('toggle-notifications-panel')"
      key="partial"

      plain
      depressed
      class="pa-0 mx-0"
      >
      <v-icon>$vuetify.icons.value.notifications
      </v-icon>

    </v-btn>
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
import { Labelable } from "@/types";
import { SENodule } from "@/models/SENodule";
import { CommandGroup } from "@/commands/CommandGroup";
import { SetNoduleDisplayCommand } from "@/commands/SetNoduleDisplayCommand";
import i18n from "../i18n";
import { mapState } from "pinia";
import { useSEStore } from "@/stores/se";
import { SEAngleMarker } from "@/models/SEAngleMarker";
import { SEPolygon } from "@/models/SEPolygon";

@Component({
  components: { BasicFrontBackStyle, OverlayWithFixButton },
  computed: {
    ...mapState(useSEStore, ["selectedSENodules"])
  }
})
export default class Style extends Vue {
  @Prop()
  readonly minified!: boolean;

  readonly selectedSENodules!: SENodule[];

  readonly toolTipOpenDelay = SETTINGS.toolTip.openDelay;
  readonly toolTipCloseDelay = SETTINGS.toolTip.closeDelay;

  private activePanel: number | undefined = 0; // Default selection is the Label panel

  private allLabelsShowing = false;
  private allObjectsShowing = false;

  // A string list of the number of items and type of them in the current selection
  private selectedItemArray: string[] = [];

  mounted(): void {
   //
  }

  @Watch("minified")
  closeAllPanels(): void {
    this.activePanel = undefined;
    // If the user has been styling objects and then, without selecting new objects, or deactivating selection the style state should be saved.

  }



  //Convert the selections into a short list of the type (and number) of the objects in the selection
  @Watch("selectedSENodules")
  private updateSelectedItemArray(): void {
    console.log("Style update selected item array: onSelectionChanged");

    const tempArray: string[] = [];
    const alreadyCounted: boolean[] = []; // records if the tempArray item has already been counted (helps avoid one tempArray item being counted multiple times -- make sure the order of the search dictated by firstPartialList is correct)
    this.selectedSENodules.forEach(node => {
      if (node instanceof SEAngleMarker) {
        tempArray.push("Am");
      } else if (node instanceof SEPolygon) {
        tempArray.push("Po");
      } else {
        tempArray.push(node.name);
      }
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
    const firstPartList = ["Pa", "Po", "P", "Li", "Ls", "C", "La", "Am", "E"]; // The *internal* names of the objects start with these strings (the oder must match the order of the singular/plural i18n keys)
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
//
  }

  //When ever the mouse leaves the style panel, save the state because it is likely that the user is done styling
  private saveStyleState(): void {
//
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
            (node as unknown as Labelable).label!,
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
