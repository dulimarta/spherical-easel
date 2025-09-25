import { Scene, Vector2, Vector3 } from "three";
import { PoseTracker } from "./PoseTracker";
import { Text } from "troika-three-text";
export class TextHandler extends PoseTracker {
  constructor(s: Scene) {
    super(s);
  }

  mouseMoved(
    event: MouseEvent,
    normalizedScreenPosition: Vector2,
    position: Vector3 | null,
    normalDirection: Vector3 | null
  ): void {
    // throw new Error("Method not implemented.");
  }
  mousePressed(
    event: MouseEvent,
    normalizedScreenPosition: Vector2,
    position: Vector3 | null,
    normalDirection: Vector3 | null
  ): void {
    super.mousePressed(
      event,
      normalizedScreenPosition,
      position,
      normalDirection
    );
    if (position) {
      const aText = new Text();
      aText.position.copy(position);
    }

    // throw new Error("Method not implemented.");
  }
  mouseReleased(
    event: MouseEvent,
    position: Vector3 | null,
    normalDirection: Vector3 | null
  ): void {
    // throw new Error("Method not implemented.");
  }
  activate(): void {
    // throw new Error("Method not implemented.");
    // if (TextHandler.textRenderer === null) {
    //   TextHandler.textRenderer = new CSS2DRenderer();
    //   TextHandler.textRenderer.setSize(window.innerWidth, window.innerHeight);
    //   TextHandler.textRenderer.domElement.style.position = "absolute";
    //   // TextHandler.textRenderer.domElement.style.top = 0;
    //   document.body.appendChild(TextHandler.textRenderer.domElement);
    // }
  }
  deactivate(): void {
    // throw new Error("Method not implemented.");
  }
}
