<template>
  <div>
    <!-- <span v-for="c in points" :key="c.id">{{c.name}}</span> -->
    <div id="topContainer" :style="indent">
      <div id="content">
        <v-icon v-if="name.startsWith('P-')">mdi-vector-point
        </v-icon>
        <v-icon v-else-if="name.startsWith('Ls-')">mdi-vector-radius
        </v-icon>
        <v-icon v-else-if="name.startsWith('Li-')">mdi-vector-line
        </v-icon>
        <v-icon v-else-if="name.startsWith('C-')">
          mdi-vector-circle-variant
        </v-icon>
        <v-icon v-else-if="name.startsWith('Intersection')">
          mdi-vector-intersection
        </v-icon>
        <div class="ml-2" :class="showClass">{{prettyName}}</div>
        <v-btn v-if="existingNodes.length > 0"
          @click="expanded = !expanded">
          <v-icon v-if="!expanded">mdi-chevron-right</v-icon>
          <v-icon v-else>mdi-chevron-down</v-icon>
        </v-btn>
      </div>
      <v-divider></v-divider>
    </div>
    <div v-if="expanded">
      <SENoduleTree v-for="(n,pos) in existingNodes" :key="pos"
        :childrren="n.kids" :depth="depth + 1" :node="n">
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
  readonly children?: SENodule[]

  @Prop()
  readonly node?: SENodule

  @Prop()
  readonly label?: string;

  @Prop()
  private showChildren!: boolean;

  @Prop()
  readonly depth!: number

  private expanded = false;

  mounted(): void {
    if (this.children)
      this.expanded = this.showChildren && this.children.length > 0;
    else this.expanded = false
  }

  get hasChildren(): boolean {
    return (this.children?.length ?? 0) > 0
  }
  get prettyName(): string {
    return this.label ?? this.name
  }
  get name(): string {
    return this.node?.name ?? "none";
  }

  get showClass(): string {
    return (this.label || this.node?.showing) ? "visibleNode" : "invisibleNode"
  }

  get existingNodes(): SENodule[] {
    if (this.children)
      return this.children.filter((n: SENodule) => n.exists)
    else return [];
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

.visibleNode {
}

.invisibleNode {
  background: lightgray;
  color: gray;
  font-style: italic;
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