<template>
  <div>
    <span
      v-show="commonStyleProperties.length === 0"
      class="text-body-2"
    >Here we go! Please select object(s) to style!</span>

    <fade-in-card :showWhen="hasColor">
      <span class="text-subtitle-2">Color</span>
      <v-color-picker
        hide-inputs
        :disabled="colorApplyTo.length === 0"
        v-model="selectedColor"
        @update:color="onColorChanged"
      ></v-color-picker>
      <span>Apply to:</span>
      <div>
        <v-checkbox
          v-model="colorApplyTo"
          dense
          v-for="(z, pos) in colorKeys"
          :key="pos"
          :label="z.label"
          :value="z.value"
        ></v-checkbox>
      </div>
    </fade-in-card>

    <fade-in-card :showWhen="hasStrokeWidth">
      <span>Stroke Width</span>
      <v-slider
        v-model.number="strokeWidth"
        :min="70"
        thumb-label="always"
        @change="onLineWidthChanged"
        :max="130"
        type="range"
        class="mt-8"
      >
        <template v-slot:thumb-label="{ value }">{{ value + "%" }}</template>
      </v-slider>
    </fade-in-card>

    <fade-in-card :showWhen="hasDash">
      <span>Dash Pattern ({{ dashLength }}/{{ gapLength }})</span>
      <v-slider
        min="5"
        max="15"
        v-model.number="dashLength"
        persistent-hint
        hint="Dash length"
        @change="onDashPatternChanged"
      ></v-slider>
      <v-slider
        min="5"
        max="15"
        v-model.number="gapLength"
        persistent-hint
        hint="Gap length"
        @change="onDashPatternChanged"
      ></v-slider>
    </fade-in-card>
  </div>
</template>
<script lang="ts">
import Vue from "vue";
import Component from "vue-class-component";
import { Watch } from "vue-property-decorator";
import { SENodule } from "../models/SENodule";
import { State } from "vuex-class";
import { Styles } from "../types/Styles";
import SETTINGS from "@/global-settings";
import FadeInCard from "@/components/FadeInCard.vue";
// import { getModule } from "vuex-module-decorators";
// import UI from "@/store/ui-styles";

/**
 * values is a list of Styles (found in @/types/styles.ts) that are number valued
 */
const values = Object.entries(Styles).filter(e => {
  const [_, b] = e;
  return typeof b === "number";
});

/**
 * keys is a list of the keys to the number valued Styles
 */
const keys = values.map(e => {
  const [a, _] = e;
  return a;
});

@Component({ components: { FadeInCard } })
export default class FrontStyle extends Vue {
  // readonly UIModule = getModule(UI, this.$store);

  @State
  readonly selections!: SENodule[];

  readonly minStrokeWidth: number = SETTINGS.line.drawn.strokeWidth.min;
  readonly maxStrokeWidth: number = SETTINGS.line.drawn.strokeWidth.max;

  // TODO: handlle background as well
  private strokeWidth = 100;
  private selectedColor: string = SETTINGS.line.drawn.strokeColor.front;
  private colorApplyTo: string[] = [];
  private dashLength = 3;
  private gapLength = 2;
  commonStyleProperties: number[] = [];

  // private commonProperties: Set<Styles>;

  constructor() {
    super();
    // this.commonProperties = new Set();
  }

  // Changes the stroke width of the elements in the *selection* array in the store
  // This method is linked to the strokeWidth fade-in-card
  onLineWidthChanged(): void {
    this.$store.commit("changeStrokeWidth", this.strokeWidth);
  }

  // Changes the stroke color of the elements in the *selection* array in the store
  // This commit is sent to the store with options includeing the selected color and ????
  onColorChanged(): void {
    this.$store.commit("changeColor", {
      color: this.selectedColor,
      props: this.colorApplyTo.map(
        (s: string) => s.replace(/ /g, "") // Remove all blanks
      )
    });
  }

  onDashPatternChanged(): void {
    this.$store.commit("changeDashPattern", [this.dashLength, this.gapLength]);
  }
  /**
   * Determines if the commonStyleProperties has the given input of type Styles
   * The input is an enum of type Styles
   */
  hasStyle(s: Styles): boolean {
    const sNum = Number(s);
    return (
      this.commonStyleProperties.length > 0 &&
      this.commonStyleProperties.findIndex(x => x === sNum) >= 0
    );
  }

  /**
   * Used to determine if the color picker Vue component (i.e. fade-in-card) should be displayed
   */
  get hasColor(): boolean {
    return (
      this.hasStyle(Styles.strokeColor) ||
      this.hasStyle(Styles.fillColorWhite) ||
      this.hasStyle(Styles.fillColorGray)
    );
  }

  /**
   * Used to determine which objects the color picker should control (i.e. the check boxes under the color picker)
   */
  get colorKeys(): any[] {
    return this.commonStyleProperties
      .map((id: number) => ({
        // Convert camelCase to title format
        // i.e. "justASimpleText" becomes "Just A Simple Text"
        label: keys[id]
          .replace(
            /([a-z])([A-Z])/g, // global regex
            (_, lowLetter, upLetter) => `${lowLetter} ${upLetter}`
          )
          .replace(/^([a-z])/, (_, firstLetter: string) =>
            firstLetter.toUpperCase()
          ),
        value: keys[id]
      }))
      .filter((e: any) => {
        const { label, _ } = e;
        return label.toLowerCase().indexOf("color") >= 0; // Select entry with "Color" in its label
      });
  }

  /**
   * Used to determine if the stroke width slider (i.e. fade-in-card containing the slider) should be displayed
   */
  get hasStrokeWidth(): boolean {
    return this.hasStyle(Styles.strokeWidthPercentage);
  }

  /**
   * Used to determine if the dash gap and dash offest sliders (i.e. fade-in-card containing the sliders) should be displayed
   */
  get hasDash(): boolean {
    return this.hasStyle(Styles.dashPattern);
  }

  /**
   * This is an example of the two-way binding that is provided by the Vuex store. As this is a Vue component we can Watch variables, and
   * when they change, this method wil execute in response to that change.
   */
  @Watch("selections")
  onSelectionChanged(newSelection: SENodule[]): void {
    // newSelection.forEach(s => {
    // console.debug("Set ", s.customStyles());
    // })
    this.commonStyleProperties.splice(0);
    if (newSelection.length === 0) {
      // console.debug("No Common props: ");
      return;
    }
    // Create a list of the common properties that the objects in the selection have.
    // commonStyleProperties is a number (corresponding to an enum) array
    // The customStyles method returns a list of the styles the are adjustable for that object
    for (let k = 0; k < values.length; k++) {
      if (newSelection.every(s => s.customStyles().has(k)))
        this.commonStyleProperties.push(k);
    }
    for (let k = this.colorApplyTo.length - 1; k >= 0; k--) {
      const idx = this.commonStyleProperties.findIndex(
        s => keys[s] === this.colorApplyTo[k]
      );
      if (idx < 0) {
        this.colorApplyTo.splice(k, 1);
      }
    }
    console.log("styles", Styles);
    console.log("values", values);
    // const propNames = this.commonStyleProperties.map(n => keys[n]).join(", ");
    // console.debug("Common props: ", propNames);
  }
}
</script>
