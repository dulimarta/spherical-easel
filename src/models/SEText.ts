import { ObjectState } from "@/types";
import i18n from "@/i18n";
import { SENodule } from "./SENodule";
import { Vector2, Vector3 } from "three";
import { Vector } from "two.js/src/vector";
import SETTINGS from "@/global-settings";
import { Visitor } from "@/visitors/Visitor";
// import { TextMoverVisitor } from "@/visitors/TextMoverVisitor";
import Text from "@/plottables/Text";
import { DisplayStyle } from "@/plottables/Nodule";
import {
  DEFAULT_TEXT_BACK_STYLE,
  DEFAULT_TEXT_FRONT_STYLE,
  DEFAULT_TEXT_TEXT_STYLE
} from "@/types/Styles";
const { t } = i18n.global;

const styleSet = new Set([
  ...Object.getOwnPropertyNames(DEFAULT_TEXT_FRONT_STYLE),
  ...Object.getOwnPropertyNames(DEFAULT_TEXT_BACK_STYLE),
  ...Object.getOwnPropertyNames(DEFAULT_TEXT_TEXT_STYLE)
]);

export class SEText extends SENodule {
  public declare ref: Text; //<- plottable Text

  private _text: string = ""; // string text
  protected _locationVector = new Vector2();

  constructor(text: string) {
    super();
    this._text = text;
    this.name = `T${SENodule.TEXT_COUNT}`;
    this.ref = new Text(text, this.name);
    this.ref.stylize(DisplayStyle.ApplyCurrentVariables);
    // Set the size for zoom
    this.ref.adjustSize();
    SENodule.TEXT_COUNT++;
  }

  public shallowUpdate(): void {
    this.ref.positionVector = this._locationVector;
    if (this.showing) {
      this.ref.setVisible(true);
    } else {
      this.ref.setVisible(false);
    }
  }

  public update(
    objectState?: Map<number, ObjectState>,
    orderedSENoduleList?: number[]
  ): void {
    //console.log(`SEText.update(${objectState}, ${orderedSENoduleList})`);
    this.setOutOfDate(false);
    this.shallowUpdate();

    if (objectState && orderedSENoduleList) {
      if (objectState.has(this.id)) {
        console.log(
          `		Text with id ${this.id} has been visited twice proceed no further down this branch of the DAG.`
        );
        return;
      }
      //console.log(`this.id = ${this.id}`);
      orderedSENoduleList.push(this.id);
      const location = new Vector2();
      location.copy(this._locationVector);
      //console.log(`_locationVector = x: ${this._locationVector.x} y: ${this._locationVector.y} z: ${this._locationVector.z} `);
      //console.log(`location = x: ${location.x} y: ${location.y} z: ${location.z} `);
      objectState.set(this.id, {
        kind: "text",
        object: this,
        locationVector: location
      });
    }
  }

  // implement for MOVE tool
  public isHitAt(
    unitIdealVector: Vector3,
    currentMagnificationFactor: number,
    screenPosition: Vector2 = new Vector2(),
    extraFactor?: number
  ): boolean {
    // Get the bounding box of the text
    const boundingBox = this.ref.boundingRectangle;
    // Get the canvas size so the bounding box can be corrected
    const canvasWidth = SENodule.store.canvasWidth;
    const canvasHeight = SENodule.store.canvasHeight;
    const zoomTranslation = SENodule.store.zoomTranslation;

    return (
      boundingBox.left - canvasWidth / 2 <
        screenPosition.x * currentMagnificationFactor + zoomTranslation[0] &&
      screenPosition.x * currentMagnificationFactor + zoomTranslation[0] <
        boundingBox.right - canvasWidth / 2 &&
      boundingBox.top - canvasHeight / 2 <
        -screenPosition.y * currentMagnificationFactor + zoomTranslation[0] &&
      -screenPosition.y * currentMagnificationFactor + zoomTranslation[0] <
        boundingBox.bottom - canvasHeight / 2
    );
  }

  // Setter and getter for the location of the text
  set locationVector(pos: Vector2) {
    this._locationVector.copy(pos);
    this.ref.positionVector = this._locationVector;
  }
  get locationVector(): Vector2 {
    return this._locationVector;
  }

  customStyles(): Set<string> {
    return styleSet;
  }

  public get noduleItemText(): string {
    return this._text;
  }
  public get noduleDescription(): string {
    return String(i18n.global.t(`objectTree.textObject`));
  }
  // Setter/Getter for the private variable text
  public get text(): string {
    return this._text;
  }
  public set text(newText: string) {
    this._text = newText;
    this.ref.text = newText; // Update the Two.js text instance
  }

  public set glowing(onOff: boolean) {
    if (onOff) this.ref.glowingDisplay();
    else this.ref.normalDisplay();
  }

  public setDefaultName(txt: string): void {
    // console.log("set default name of ", this.name, "to", txt)
    this.ref.setDefaultText(txt);
  }
  public accept(v: Visitor): boolean {
    return false;
  }
}
