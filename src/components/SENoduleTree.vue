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
        <div class="ml-1" :class="showClass">{{prettyName}}</div>
        <div v-show="node" @click="toggleVisibility" class="mr-2">
          <v-icon small v-if="isHidden">
            mdi-eye
          </v-icon>
          <v-icon small v-else style="color:gray">
            mdi-eye-off
          </v-icon>
        </div>
        <v-btn small v-show="hasExistingChildren"
          @click="expanded = !expanded">
          <v-icon small dense v-if="!expanded">mdi-chevron-right</v-icon>
          <v-icon small v-else>mdi-chevron-down</v-icon>
        </v-btn>
      </div>
      <!-- Expanded: {{expanded}} {{children}} {{existingNodes}} -->
      <v-divider></v-divider>
      <div v-show="expanded">
        <SENoduleTree v-for="(n,pos) in existingChildren" :key="pos"
          :children="n.kids" :depth="depth + 1" :node="n">
        </SENoduleTree>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import Vue from 'vue'
import Component from 'vue-class-component';
import { Prop } from 'vue-property-decorator';
import { SENodule } from '../models/SENodule';
import { SEIntersectionPoint } from '../models/SEIntersectionPoint';

@Component({})
export default class SENoduleTree extends Vue {

  @Prop()
  readonly children!: SENodule[]

  @Prop()
  readonly node?: SENodule

  @Prop()
  readonly label?: string; /** Wheen defined, label takes over the node name */

  @Prop()
  private showChildren!: boolean;

  @Prop()
  readonly depth!: number /** The depth value controls the indentation level */

  private expanded = false;

  mounted(): void {
    if (this.children)
      this.expanded = this.showChildren && this.children.length > 0;
    else this.expanded = false
  }

  toggleVisibility() {
    if (this.node) {
      this.node.showing = !this.node.showing
    }
  }
  get hasExistingChildren(): boolean {
    return this.existingChildren.length > 0
  }

  get isHidden(): boolean {
    return this.node ? !this.node.showing : false;

  }
  get prettyName(): string {
    return this.label ?? this.name
  }

  get name(): string {
    return this.node?.name ?? "None";
  }

  get showClass(): string {
    return (this.label || this.node?.showing) ? "visibleNode" : "invisibleNode"
  }

  get existingChildren(): SENodule[] {
    return this.children.filter((n: SENodule) => {
      if (n instanceof SEIntersectionPoint)
        return n.isUserCreated;
      else return n.exists
    })
  }

  get indent(): any {
    return { marginLeft: `${this.depth * 8}px` }
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
  // background: lightgray;
  color: gray;
  font-style: italic;
}
#content {
  display: flex;
  flex-direction: row;
  align-items: center;
  margin: 0 0.25em;
  div:first-of-type {
    flex-grow: 1;
  }
  v-icon {
    flex-grow: 0;
  }
}
</style>