import MouseHandler from "./MouseHandler";

export default class SelectionHandler extends MouseHandler {
  activate(): void {
    window.addEventListener("keypress", this.keyPressHandler);
  }

  deactivate(): void {
    window.removeEventListener("keypress", this.keyPressHandler);
  }

  keyPressHandler = (e: KeyboardEvent): void => {
    // None
    if (this.hitSENodules?.length <= 1) return;
    if (e.key.match(/[0-9]/)) {
      // is it a digit?
      const val = Number(e.key) - 1;
      this.hitSENodules.forEach((n, pos) => {
        if (pos === val) {
          (n as any).ref.glowingDisplay();
          // Show the name of the selected item
          this.infoText.text = n.name;
        } else (n as any).ref.normalDisplay();
        pos === val;
      });
    }
  };

  mouseMoved(event: MouseEvent): void {
    super.mouseMoved(event);
    const what = this.store.getters.findNearbyObjects(
      this.currentSphereVector,
      this.currentScreenVector
    );
    // console.debug(what);
    // console.debug(this.hitLines);
    // console.debug(this.hitSegments);
    // console.debug(this.hi)
  }

  mousePressed(event: MouseEvent): void {
    if (this.hitSENodules.length == 1) {
      console.debug("Single selection", this.hitSENodules[0].name);
    } else if (this.hitSENodules.length > 1) {
      console.debug("Multiple selections");
      this.hitSENodules.forEach(n => {
        console.debug(n.name);
      });
    }
  }
  mouseReleased(event: MouseEvent): void {
    // No code yet
  }
}
