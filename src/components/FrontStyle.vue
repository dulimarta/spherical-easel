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
        @update:color="onColorChange"
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
        v-model.number="strokeWidthPercent"
        :min="70"
        thumb-label="always"
        @change="onStrokeWidthPercentChange"
        :max="500"
        type="range"
        class="mt-8"
      >
        <template v-slot:thumb-label="{ value }">{{ value + "%" }}</template>
      </v-slider>
    </fade-in-card>

    <fade-in-card :showWhen="hasPointRadius">
      <span>Point Size</span>
      <v-slider
        v-model.number="pointRadiusPercent"
        :min="70"
        thumb-label="always"
        @change="onPointRadiusPercentChange"
        :max="500"
        type="range"
        class="mt-8"
      >
        <template v-slot:thumb-label="{ value }">{{ value + "%" }}</template>
      </v-slider>
    </fade-in-card>

    <fade-in-card :showWhen="hasOpacity">
      <span>Opacity</span>
      <v-slider
        v-model.number="opacity"
        prepend-icon="mdi-opacity"
        :min="-0.1"
        :step="0.01"
        :max="1"
        thumb-label="always"
        @change="onOpacityChange"
        type="range"
        class="mt-8"
      >
        <template v-slot:thumb-label="{ value }">{{ value + "%" }}</template>
      </v-slider>
    </fade-in-card>

    <fade-in-card :showWhen="hasDash">
      <span>Dash Pattern ({{ dashLength }}/{{ gapLength }}) with Offset {{dashOffset}}</span>
      <v-slider
        min="5"
        max="15"
        v-model.number="dashLength"
        persistent-hint
        hint="Dash length"
        @change="onDashPatternChange"
      ></v-slider>
      <v-slider
        min="5"
        max="15"
        v-model.number="gapLength"
        persistent-hint
        hint="Gap length"
        @change="onDashPatternChange"
      ></v-slider>
      <v-slider
        min="5"
        max="15"
        v-model.number="dashOffset"
        persistent-hint
        hint="Dash Offset"
        @change="onDashPatternChange"
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
  @State
  readonly selections!: SENodule[];

  readonly minStrokeWidth: number = SETTINGS.line.drawn.strokeWidth.min;
  readonly maxStrokeWidth: number = SETTINGS.line.drawn.strokeWidth.max;

  // TODO: handlle background as well

  private strokeWidthPercent = 100;
  private pointRadiusPercent = 100;
  private selectedColor: string = SETTINGS.line.drawn.strokeColor.front;
  private colorApplyTo: string[] = [];
  private dashLength = 3;
  private gapLength = 2;
  private dashOffset = 1;
  private opacity = 1;
  private dynamicBackStyle = true;
  commonStyleProperties: number[] = [];

  //   xstrokeWidthPercentage,
  //   xstrokeColor,
  //   xfillColor,
  //   xdashArray,
  //   xdashOffset,
  //   opacity,
  //   dynamicBackStyle,
  //   pointRadiusPercent

  constructor() {
    super();
  }

  // Changes the stroke width of the elements in the *selection* array in the store
  // This method is linked to the strokeWidthPercent fade-in-card
  onStrokeWidthPercentChange(): void {
    console.log("stroke cheng", this.strokeWidthPercent);
    this.$store.commit("changeStyle", {
      front: true,
      strokeWidthPercent: this.strokeWidthPercent
    });
  }

  // Changes the stroke color of the elements in the *selection* array in the store
  // This commit is sent to the store with options includeing the selected color and ????
  onColorChange(): void {
    this.$store.commit("changeStyle", {
      front: true,
      color: this.selectedColor,
      props: this.colorApplyTo.map(
        (s: string) => s.replace(/ /g, "") // Remove all blanks
      )
    });
  }

  onDashPatternChange(): void {
    this.$store.commit("changeStyle", {
      front: true,
      dashArray: [this.dashLength, this.gapLength],
      dashOffset: this.dashOffset
    });
  }

  onOpacityChange(): void {
    console.log("colorApplyTo", this.colorApplyTo);
    this.$store.commit("changeStyle", { front: true, opacity: this.opacity });
  }

  onPointRadiusPercentChange(): void {
    this.$store.commit("changeStyle", {
      front: true,
      pointRadiusPercent: this.pointRadiusPercent
    });
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
   * Used to determine if the color picker Vue component (i.e. fade-in-card) should be displayed
   */
  get hasColor(): boolean {
    return this.hasStyle(Styles.strokeColor) || this.hasStyle(Styles.fillColor);
  }

  /**
   * Used to determine if the stroke width slider (i.e. fade-in-card containing the slider) should be displayed
   */
  get hasStrokeWidth(): boolean {
    return this.hasStyle(Styles.strokeWidthPercentage);
  }

  get hasPointRadius(): boolean {
    return this.hasStyle(Styles.pointRadiusPercent);
  }

  get hasOpacity(): boolean {
    return this.hasStyle(Styles.opacity);
  }
  /**
   * Used to determine if the dash on, dash off and dash offest sliders (i.e. fade-in-card containing the sliders) should be displayed
   */
  get hasDash(): boolean {
    return this.hasStyle(Styles.dashArray);
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
    // console.log("colorApplyTo", this.colorApplyTo);
    // for (let k = this.colorApplyTo.length - 1; k >= 0; k--) {
    //   console.log("here");
    //   const idx = this.commonStyleProperties.findIndex(
    //     s => keys[s] === this.colorApplyTo[k]
    //   );
    //   if (idx < 0) {
    //     this.colorApplyTo.splice(k, 1);
    //   }
    // }
    for (let i = 0; i < this.commonStyleProperties.length; i++) {
      console.log("attirbutre", Styles[this.commonStyleProperties[i]]);
      if (Styles[this.commonStyleProperties[i]].includes("Color")) {
        this.colorApplyTo.push(Styles[this.commonStyleProperties[i]]);
        break;
      }
    }

    console.log("commmonStyle", this.commonStyleProperties);
    console.log("colorApplyTo", this.colorApplyTo);
    console.log("styles", Styles);
    console.log("values", values);
    // const propNames = this.commonStyleProperties.map(n => keys[n]).join(", ");
    // console.debug("Common props: ", propNames);
  }
}
</script>
