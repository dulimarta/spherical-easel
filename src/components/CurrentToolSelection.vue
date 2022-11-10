<template>
  <div>
    <!-- Displays the current tool in the left panel by the collapsible arorw -->
    <div v-if="!toolboxMinified">
      <div class="pa-4"
        v-if="activeToolName">
        <v-row>
          <v-icon class="mr-2"
            :key="Math.random()">$vuetify.icons.values.{{actionMode}}
          </v-icon>
          <!-- Checks if ApplyTransformation is selected and changes the display accordingly. -->
          <h3 v-if="activeToolName != 'ApplyTransformationDisplayedName'">
            {{$t(`buttons.${activeToolName}`, {}).toString()}}</h3>
          <template v-else>
            <h3>
              {{$t(`buttons.${activeToolName}`, {}).toString()}}
              <br>
              <h4 class="ap"
                :key="Math.random()">{{applyTransformationText}}</h4>
            </h3>
          </template>
        </v-row>
      </div>
      <div v-else>
        <h2>{{$t(`buttons.NoToolSelected`, {}).toString()}}</h2>
      </div>
    </div>
    <!-- Displays the icon and arrow if toolbox is minified -->
    <div v-else>
      <div class="pa-4"
        v-if="activeToolName">
        <v-row>
          <v-icon class="mr-3"
            :key="Math.random()">$vuetify.icons.values.{{actionMode}}
          </v-icon>
        </v-row>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { Vue, Component, Prop, Watch } from "vue-property-decorator";
import { mapActions, mapState } from "pinia";
import { useSEStore } from "@/stores/se";
import i18n from "@/i18n";
import EventBus from "@/eventHandlers/EventBus";

@Component({
  computed: {
    ...mapState(useSEStore, ["activeToolName", "actionMode"])
  }
})
export default class CurrentToolSelection extends Vue {
  @Prop() toolboxMinified: boolean | undefined;
  private actionMode: string | undefined;

  readonly activeToolName!: string | undefined;
  private currentToolIcon: string | undefined;
  private applyTransformationText = i18n.t(`objects.selectTransformation`);

  //The next 3 functions are for the text for the applied transformation.
  created(): void {
    EventBus.listen(
      "set-apply-transformation-footer-text",
      this.additionalFooterText
    );
  }
  additionalFooterText(e: { text: string }): void {
    //console.debug("apply transform", e.text);
    this.applyTransformationText = e.text;
  }

  beforeDestroy(): void {
    EventBus.unlisten("set-apply-transformation-footer-text");
  }
}
</script>

<style>
</style>