import Vue from "vue";
/** This class enables communications between non-Vue classes
 * with Vue components */

class EventBus {
  private vueInstance: Vue;

  constructor() {
    this.vueInstance = new Vue();
  }

  fire(eventName: string, data: any): void {
    this.verifyKebabCase(eventName);
    this.vueInstance.$emit(eventName, data);
  }

  listen(eventName: string, callback: any) {
    this.verifyKebabCase(eventName);
    this.vueInstance.$on(eventName, callback);
  }

  unlisten(eventName: string): void {
    this.verifyKebabCase(eventName);
    this.vueInstance.$off(eventName);
  }
  // TODO: do we need a function to "unregister" the event listener?

  private verifyKebabCase(name: string): void {
    if (name.match(/[a-z]+(-[a-z]+)+/)) return;
    throw `${name} is not in kebab-case`;
  }
}

export default new EventBus();
