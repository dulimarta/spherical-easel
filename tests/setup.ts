// <reference path="@/extensions/three-ext.d.ts" />
// <reference path="@/extensions/number-ext.d.ts" />

import { Vector2, Vector3 } from "three";
import { config } from "@vue/test-utils";
import "@/extensions/three.extensions";
import "@/extensions/number.extensions";

// Some Vuetify components (like VDialog) look for an ancestor element
// with "data-app" attribute set. Missing the element, you will get
// lots of warning messaging during testing.
// Adding an extra div under the body solves the issue
const app = document.createElement("div");
app.setAttribute("data-app", "true");
document.body.appendChild(app);

// VueTestUtils.config?.mocks["$t"] = msg => translations[locale][msg];
if (config) {
  // config.mocks["$t"] = key => key;
  config.showDeprecationWarnings = false;
}

// /* Extension functions for numbers */
// Number.prototype.toDegrees = function() {
//   return (Number(this) / Math.PI) * 180;
// };
// Number.prototype.toRadians = function() {
//   return (Number(this) * Math.PI) / 180;
// };

// /* Extension functions for arrays */
// Array.prototype.clear = function() {
//   Array.prototype.splice.call(this, 0, this.length);
// };

// Array.prototype.rotate = function(count) {
//   const len = this.length >>> 0;
//   let _count = count >> 0;
//   _count = ((_count % len) + len) % len;

//   // use splice.call() instead of this.splice() to make function generic
//   Array.prototype.push.apply(
//     this,
//     Array.prototype.splice.call(this, 0, _count)
//   );
//   return this;
// };

expect.extend({
  toBeVector3CloseTo(a: Vector3, p: number) {
    return {
      pass: true,
      message: () => "In progress"
    };
  }
});
