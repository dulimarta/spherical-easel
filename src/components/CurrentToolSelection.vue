<template>
  <div >
    <!-- Displays the current tool in the left panel by the collapsible arorw -->
    <div v-if="!toolboxMinified">
      <div class="pa-4"
        v-if="activeToolName">
        <v-row>
          <v-icon class="mr-2"
            :key="Math.random()">$vuetify.icons.values.{{actionMode}}
          </v-icon>
          <h3>{{$t(`buttons.${activeToolName}`, {}).toString()}}</h3>
        </v-row>
      </div>
      <div v-else>
        <h2>{{$t(`buttons.NoToolSelected`, {}).toString()}}</h2>
      </div>
    </div>

  </div>
</template>

<script lang="ts">
import { Vue, Component, Prop, Watch } from "vue-property-decorator";
import { mapActions, mapState } from "pinia";
import { useSEStore } from "@/stores/se";

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
}
</script>

<style>
</style>