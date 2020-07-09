<template>
  <v-expansion-panels>
    <v-expansion-panel>
      <template v-for="(p,idx) in panels">
        <v-expansion-panel-header :key="`header${idx}`">{{p.name}}
        </v-expansion-panel-header>
        <v-expansion-panel-content :key="`content${idx}`">
          <component :is="p.component"></component>
        </v-expansion-panel-content>

      </template>
    </v-expansion-panel>
  </v-expansion-panels>
</template>

<script lang="ts">
import Vue from 'vue';
import Component from "vue-class-component"
import FrontStyle from "@/components/FrontStyle.vue";




@Component({ components: { FrontStyle } })
export default class Style extends Vue {
  private readonly panels = [{
    name: "FrontStyle",
    component: () => import("@/components/FrontStyle.vue")
  }]

}
</script>

<style scoped>
</style>