import Vue from "vue";
/** This class enables communications between non-Vue classes
 * with Vue components */

class EventBus {
  private vueInstance: Vue;

  constructor() {
    this.vueInstance = new Vue();
  }

  fire(eventName: string, data: any): void {
    this.vueInstance.$emit(eventName, data);
  }

  listen(eventName: string, callback: any) {
    this.vueInstance.$on(eventName, callback);
  }
}

export default new EventBus();
