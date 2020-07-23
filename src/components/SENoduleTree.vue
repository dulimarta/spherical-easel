<template>
  <div>
    <!-- <span v-for="c in points" :key="c.id">{{c.name}}</span> -->
    <div id="topContainer" :style="indent">
      <div id="content">
        <v-icon v-if="label.startsWith('P-')">mdi-vector-point</v-icon>
        <v-icon v-else-if="label.startsWith('Ls-')">mdi-vector-radius
        </v-icon>
        <v-icon v-else-if="label.startsWith('Li-')">mdi-vector-line
        </v-icon>
        <v-icon v-else-if="label.startsWith('C-')">
          mdi-vector-circle-variant
        </v-icon>
        <div>{{label}}</div>
        <v-btn v-if="visibleNodes.length > 0"
          @click="expanded = !expanded">
          <v-icon v-if="!expanded">mdi-chevron-right</v-icon>
          <v-icon v-else>mdi-chevron-down</v-icon>
        </v-btn>
      </div>
      <v-divider></v-divider>
    </div>
    <div v-if="expanded">
      <SENoduleTree v-for="(n,pos) in visibleNodes" :key="pos"
        :nodes="n.kids" :depth="depth + 1" :label="`${n.name} (${n.id})`">
      </SENoduleTree>
    </div>
  </div>
</template>

<script lang="ts">
import Vue from 'vue'
import Component from 'vue-class-component';
import { Prop } from 'vue-property-decorator';
import { SENodule } from '../models/SENodule';

@Component({})
export default class SENoduleTree extends Vue {

  @Prop()
  readonly nodes!: SENodule[]

  @Prop()
  readonly label!: string;

  @Prop()
  private showChildren!: boolean;

  @Prop()
  readonly depth!: number

  private expanded = false;

  mounted(): void {
    this.expanded = this.showChildren && this.nodes.length > 0;
  }

  get visibleNodes(): SENodule[] {
    return this.nodes.filter((n: SENodule) => n.showing)
  }

  get indent(): any {
    return { marginLeft: `${this.depth * 16}px` }
  }
}
</script>

<style scoped lang="scss">
#topContainer {
  margin: 0.25em 0;
}
.deep {
  background-color: red;
}
#content {
  display: flex;
  flex-direction: row;
  justify-items: center;
  margin: 0 0.25em;
  div {
    flex-grow: 1;
  }
  v-icon {
    flex-grow: 0;
  }
}
</style>