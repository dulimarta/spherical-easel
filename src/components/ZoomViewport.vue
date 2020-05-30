<template>
  <div id="viewport" ref="viewport" :sssstyle="{ height: heightInPixel }">
    <div :ssssstyle="{ transform: transformStyle }">
      <slot></slot>
      <!-- child contents go here -->
    </div>
  </div>
</template>

<script lang="ts">
import Vue from "vue";
import Component from "vue-class-component";
import { Prop } from "vue-property-decorator";
import { Vector3, Matrix4 } from "three";

/**
 * This component is a wrapper that adds zoom in/out feature to its
 * descendent component. Zooming is implemented using CSS transform rules
 * and listening for mouse wheel events (or pinch/zoom trackpad gestures)
 *
 * Properties:
 * view-height the content height
 * min-zoom: the minimum zoom factor when further zoom out is ignored
 * max-zoem: the maximum zoom factor when further zoom in is ignored
 *
 * Events:
 *   max-zoom-out: emitted when reaching max-zoom limit
 *   max-zoom-in: emitted when reaching min-zoom limit
 */

// TODO: auto compute the cotent height?
@Component
export default class ZoomViewport extends Vue {
  @Prop(Number)
  readonly viewWidth!: number; /* currently unused */

  // camelCase in code is kebab-case in HTML.
  // So the corresponding HTML attribute is view-height
  @Prop(Number)
  readonly viewHeight!: number; // REQUIRED prop (non-null)

  @Prop(Number)
  readonly minZoom?: number; // Optional prop

  @Prop(Number)
  readonly maxZoom?: number; // Optional prop

  private minZoomFactor = this.minZoom || 0.3; // Default minimum zoom factor
  private maxZoomFactor = this.maxZoom || 3.0; // Default maximum zoom factor
  private transformStyle = "";
  private parentBox: any = {};
  private scaleFactor = 1;
  private transformMatrix: Matrix4 = new Matrix4();
  private viewMatrix = new Matrix4();
  private tmpMatrix = new Matrix4();
  private tmpVector = new Vector3();

  get heightInPixel(): string {
    return this.viewHeight + "px";
  }

  mounted(): void {
    const el = this.$refs.viewport as HTMLElement;

    // Use the mouse wheel to zoom in / out
    // Use the "passive" option for better performance
    // https://stackoverflow.com/questions/37721782/what-are-passive-event-listeners

    el.addEventListener("resize", () => {
      // eslint-disable-next-line no-debugger
      debugger;
      console.debug("Resized!!!")
    })
    // el.addEventListener("wheel", this.zoomer, { passive: true });
    this.parentBox = el.getBoundingClientRect();
    console.debug(`Parent at mounted: ${this.viewWidth}x${this.viewHeight}`)
    // this.viewMatrix.makeOrthographic(
    //   -this.viewWidth / 2,
    //   this.viewWidth / 2,
    //   -this.viewHeight / 2,
    //   this.viewHeight / 2,
    //   -1,
    //   +1
    // );
    // el.addEventListener("mousemove", this.mover);
  }

  updated(): void {
    const el = this.$refs.viewport as HTMLElement;

    // check the bounding rectangle again, in case the child contents
    // changes dimension
    const boxNow = el.getBoundingClientRect();
    this.parentBox = el.getBoundingClientRect();
    console.debug(`Parent at update: ${this.parentBox.width}x${this.parentBox.height}`)
  }

  mover(e: MouseEvent): void {
    this.tmpVector.set(e.offsetX, e.offsetY, 0);
    console.debug("Mouse", this.tmpVector.toFixed(2));
    this.tmpVector.applyMatrix4(this.viewMatrix);
    console.debug("View", this.tmpVector.toFixed(2));
  }
  zoomer(e: MouseWheelEvent): void {
    // e.preventDefault(); // Don't propagate this event to the rest of the world
    // Calculate percentage w.r.t viewport height
    let scrollFraction = e.deltaY / this.parentBox.height;
    if (e.ctrlKey) {
      // Flip the sign for pinch/zoom gestures on Mac trackpad
      scrollFraction *= -1;
    }

    console.debug("Scale factor", this.scaleFactor);
    // If trying to zoom in/out beyond the limit, ignore it
    if (this.scaleFactor < this.minZoomFactor && scrollFraction < 0) {
      this.$emit("max-zoom-out");
      return;
    }
    if (this.scaleFactor > this.maxZoomFactor && scrollFraction > 0) {
      this.$emit("max-zoom-in");
      return;
    }

    // Positive scroll: scale up/zoom in
    // Negative scroll: scale down/zoom out
    this.scaleFactor *= 1 + scrollFraction;
    if (this.scaleFactor > 1) {
      // When zooming bigger than the original size,
      // use the current mouse position as the scale origin

      // How far is the mouse from the center of the viewport
      const tx = Math.floor(e.offsetX - this.parentBox.width / 2);
      const ty = Math.floor(e.offsetY - this.parentBox.height / 2);

      this.transformMatrix.makeTranslation(tx, ty, 0);
      this.tmpMatrix.makeScale(this.scaleFactor, this.scaleFactor, 0);
      this.transformMatrix.multiply(this.tmpMatrix);
      this.tmpMatrix.makeTranslation(-tx, -ty, 0);
      this.transformMatrix.multiply(this.tmpMatrix);
      // Use composite transform to scale from the current mouse position (e.offsetX, e.offsetY)
      // Order of these three transformations are important.
      // The browser applies them from right to left
      // this.transformStyle =
      //   `translate(${tx}px,${ty}px) ` + /* translate back to mouse position */
      //   `scale(${this.scaleFactor}) ` + /* scale from origin */
      //   `translate(${-tx}px,${-ty}px)`; /* translate mouse position to origin */
    } else {
      // when zooming (out) smaller than the original size, scale from the origin
      // eslint-disable-next-line no-debugger
      this.transformMatrix.makeScale(
        this.scaleFactor,
        this.scaleFactor,
        this.scaleFactor
      );
    }
    const m = this.transformMatrix.elements;

    // this.transformStyle = `scale(${this.scaleFactor})`;
    this.transformStyle = `matrix(${m[0]},${m[1]},${m[4]},${m[5]}, ${m[12]}, ${m[13]})`;
  }
}
</script>

<style lang="scss" scoped>
#viewport {
  margin: 0;
  padding: 0;

  div {
    // background-color: yellow;
  }
}
</style>
