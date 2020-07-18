import Vue from "vue";
import Vuetify from "vuetify";
import Vuex from "vuex";
import VueI18n from "vue-i18n";
import { Vector2, Vector3 } from "three";
import { config } from "@vue/test-utils";
import SETTINGS from "@/globalSettings";
// import "jest-extended";
Vue.use(Vuex);
Vue.use(Vuetify);
Vue.use(VueI18n);

// VueTestUtils.config?.mocks["$t"] = msg => translations[locale][msg];
if (config) {
  config.mocks["$t"] = key => key;
  //   // config.logModifiedComponents = false;
}
/* Extension functions for Vector2 and Vector3 */
Vector2.prototype.toFixed = function(precision) {
  return (
    "(" + this.x.toFixed(precision) + "," + this.y.toFixed(precision) + ")"
  );
};
Vector3.prototype.toFixed = function(precision) {
  return (
    "(" +
    this.x.toFixed(precision) +
    "," +
    this.y.toFixed(precision) +
    "," +
    this.z.toFixed(precision) +
    ")"
  );
};

Vector3.prototype.isZero = function(tolerance) {
  const TOLERANCE = tolerance | (Math.PI / 1000);
  return (
    Math.abs(this.x) < TOLERANCE &&
    Math.abs(this.y) < TOLERANCE &&
    Math.abs(this.z) < TOLERANCE
  );
};

/* Extension functions for numbers */
Number.prototype.toDegrees = function() {
  return (Number(this) / Math.PI) * 180;
};
Number.prototype.toRadians = function() {
  return (Number(this) * Math.PI) / 180;
};

/* Extension functions for arrays */
Array.prototype.clear = function() {
  Array.prototype.splice.call(this, 0, this.length);
};

Array.prototype.rotate = function(count) {
  const len = this.length >>> 0;
  let _count = count >> 0;
  _count = ((_count % len) + len) % len;

  // use splice.call() instead of this.splice() to make function generic
  Array.prototype.push.apply(
    this,
    Array.prototype.splice.call(this, 0, _count)
  );
  return this;
};
