<template>
  <div id="viewport" ref="viewport" :style="{height: heightInPixel}">
    <div :style="{transform: transformStyle}">
      <slot></slot> <!-- child contents go here -->
    </div>
  </div>
</template>

<script lang="ts">
import Vue from 'vue'
import Component from 'vue-class-component';
import { Prop } from 'vue-property-decorator';

/** 
 * This component is a wrapper that adds zoom in/out feature to its
 * descendent component. Zooming is implemented using CSS transform rules.
 * 
 * Properties:
 * 
 * view-height the content height
 * min-zoom: the minimum zoom factor when further zoom out is ignored
 * max-zomm: the maximum zoom factor when further zoom in is ignored
 */

// TODO: auto compute the cotent height?
@Component
export default class ZoomViewport extends Vue {
  private transformStyle = ""
  private parentBox: any = {}
  private scaleFactor = 1;

  @Prop(Number)
  readonly viewWidth!: number /* currently unused */

  // camelCase in code is kebab-case in HTML. 
  // So the corresponding HTML attribute is view-height
  @Prop(Number)
  readonly viewHeight!: number // REQUIRED prop (non-null)

  @Prop(Number)
  readonly minZoom?: number // Optional prop

  @Prop(Number)
  readonly maxZoom?: number // Optional prop

  private minZoomFactor = this.minZoom || 0.3; // Default minimum zoom factor
  private maxZoomFactor = this.maxZoom || 3.0; // Default maximum zoom factor

  get heightInPixel(): string {
    return this.viewHeight + "px"
  }

  mounted(): void {
    const el = (this.$refs.viewport as HTMLElement);
    el.addEventListener('wheel', this.zoomer);
    this.parentBox = el.getBoundingClientRect();
  }

  zoomer(e: MouseWheelEvent): void {
    e.preventDefault(); // Don't propagate this event to the rest of the world
    // Calculate percentage w.r.t viewport height
    const scrollFraction = e.deltaY / this.parentBox.height;

    // If trying to zoom in/out beyond the limit, ignore it
    if (this.scaleFactor < this.minZoomFactor && scrollFraction < 0) return;
    if (this.scaleFactor > this.maxZoomFactor && scrollFraction > 0) return;

    // Positive scroll: scale up/zoom in
    // Negative scroll: scale down/zoom out 
    this.scaleFactor *= 1 + scrollFraction;
    if (this.scaleFactor > 1) {
      // When zooming bigger than the original size, 
      // use the current mouse position as the scale origin

      // How far is the mouse from the center of the viewport
      const tx = Math.floor(e.offsetX - (this.parentBox.width / 2));
      const ty = Math.floor(e.offsetY - (this.parentBox.height / 2));

      // Use composite transform to scale from the current mouse position (e.offsetX, e.offsetY)
      // Order of these three transformations are important.
      // The browser applies them from right to left
      this.transformStyle =
        `translate(${tx}px,${ty}px) ` + /* translate back to mouse position */
        `scale(${this.scaleFactor}) ` + /* scale from origin */
        `translate(${-tx}px,${-ty}px)`; /* translate mouse position to origin */
    } else {
      // when zooming (out) smaller than the original size, scale from the origin
      this.transformStyle = `scale(${this.scaleFactor})`;
    }

  }
}
</script>

<style lang="scss" scoped>
#viewport {
  margin: 0;
  padding: 0;
}
</style>