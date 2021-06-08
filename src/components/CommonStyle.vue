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
}
