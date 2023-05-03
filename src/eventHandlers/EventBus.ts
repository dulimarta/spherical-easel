/** This class enables communications between non-Vue classes
 * with Vue components */
// Vue3 deprecated $on, $off, $emit, so we have to use
// a third party library for firing, listening, and registering events

import mitt, { Emitter } from "mitt"

class EventBus {
  private mitt: Emitter<any>

  constructor() {
    this.mitt = mitt()
  }

  fire(eventName: string, data: any): void {
    this.verifyKebabCase(eventName);
    this.mitt.emit(eventName, data);
  }

  listen(eventName: string, callback: any) {
    this.verifyKebabCase(eventName);
    this.mitt.on(eventName, callback);
  }

  unlisten(eventName: string): void {
    this.verifyKebabCase(eventName);
    this.mitt.off(eventName);
  }
  // TODO: do we need a function to "unregister" the event listener?

  private verifyKebabCase(name: string): void {
    if (name.match(/[a-z]+(-[a-z]+)+/)) return;
    throw `${name} is not in kebab-case`;
  }
}

export default new EventBus();
