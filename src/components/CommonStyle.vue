<template>
  <div>
  </div>
</template>
<script lang="ts">
import { StyleEditPanels, StyleOptions } from "@/types/Styles";
import Vue from "vue";
import Component from "vue-class-component";
import { SENodule } from "../models/SENodule";

//@Component({})
export default abstract class CommonStyle extends Vue {
  // The old selection to help with undo/redo commands
  static oldSelection: SENodule[] = [];
  static savedFromThisPanel: StyleEditPanels = StyleEditPanels.Label;

  constructor() {
    super();
  }

  areEquivalentStyles(
    styleStates1: StyleOptions[],
    styleStates2: StyleOptions[]
  ): boolean {
    if (styleStates1.length !== styleStates2.length) {
      throw "Attempted to compare two different length styles in areEquivalentStyles";
      //return false;
    }
    for (let i = 0; i < styleStates1.length; i++) {
      const a = styleStates1[i];
      const b = styleStates2[i];
      if (
        a.strokeWidthPercent === b.strokeWidthPercent &&
        a.strokeColor === b.strokeColor &&
        a.fillColor === b.fillColor &&
        a.dynamicBackStyle === b.dynamicBackStyle &&
        a.pointRadiusPercent === b.pointRadiusPercent &&
        a.labelDisplayText === b.labelDisplayText &&
        a.labelDisplayCaption === b.labelDisplayCaption &&
        a.labelTextStyle === b.labelTextStyle &&
        a.labelTextFamily === b.labelTextFamily &&
        a.labelTextDecoration === b.labelTextDecoration &&
        a.labelTextRotation === b.labelTextRotation &&
        a.labelTextScalePercent === b.labelTextScalePercent &&
        a.labelDisplayMode === b.labelDisplayMode &&
        a.labelVisibility === b.labelVisibility &&
        a.objectVisibility === b.objectVisibility
      ) {
        //now check the dash array which can be undefined, an empty array,length one array or a length two array.
        if (a.dashArray === undefined && b.dashArray === undefined) {
          break; // stop checking this pair in the array because we can conclude they are equal.
        }
        if (a.dashArray !== undefined && b.dashArray !== undefined) {
          if (a.dashArray.length === b.dashArray.length) {
            if (a.dashArray.length === 0 && b.dashArray.length === 0) {
              break; // stop checking this pair in the array because we can conclude they are equal.
            } else if (
              a.dashArray.length === 1 &&
              b.dashArray.length === 1 &&
              a.dashArray[0] === b.dashArray[0]
            ) {
              break; // stop checking this pair in the array because we can conclude they are equal.
            } else if (
              a.dashArray.length === 2 &&
              b.dashArray.length === 2 &&
              a.dashArray[0] === b.dashArray[0] &&
              a.dashArray[1] === b.dashArray[1]
            ) {
              break; // stop checking this pair in the array because we can conclude they are equal.
            } else {
              return false;
            }
          } else {
            return false;
          }
        } else {
          return false;
        }
      } else {
        return false;
      }
    }
    // If we reach here the arrays of style states are equal
    return true;
  }
}
