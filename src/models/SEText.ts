import { ObjectState } from "@/types";
import i18n from "@/i18n";
import { SENodule } from "./SENodule";
import { Vector3 } from "three";
import { Vector } from "two.js/src/vector";
import SETTINGS from "@/global-settings";
import { Visitor } from "@/visitors/Visitor";
import { TextMoverVisitor } from "@/visitors/TextMoverVisitor";
import Text from "@/plottables/Text";
const { t } = i18n.global;

export class SEText extends SENodule {
	public declare ref: Text //<- plottable Text

	private text: string;// string text
	protected _locationVector = new Vector3();

	constructor(txt:string, x:number, y:number) {
		super();
    // TODO: Getter for text
		this.text = txt;
    console.log(`SEText.x = ${x}, SEText.y = ${-y}`);
    const text = new Text(this.text, x, -y, this.name);
    this.ref = text;
    this._locationVector = this.ref.positionVector;
    SENodule.TEXT_COUNT++;
    this.name = `T${SENodule.TEXT_COUNT}`;
    console.log(`_locationVector of ${this.name} = x: ${this._locationVector.x}, y: ${this._locationVector.y}, z: ${this._locationVector.z}`);
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
        console.log(`this.id = ${this.id}`);
      	orderedSENoduleList.push(this.id);
      	const location = new Vector3();
      	location.copy(this._locationVector);
        console.log(`_locationVector = x: ${this._locationVector.x} y: ${this._locationVector.y} z: ${this._locationVector.z} `);
        console.log(`location = x: ${location.x} y: ${location.y} z: ${location.z} `);
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
    screenPosition: Vector = new Vector()
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

  public textDirectLocationSetter(pos: Vector3): void {
    // Record the location on the unit ideal sphere of this SEPoint
    this._locationVector.copy(pos);
    // Set the position of the associated displayed plottable Point
    this.ref.positionVector = this._locationVector;
    if (this.showing) {
      this.ref.updateDisplay();
    }
  }

  set locationVector(pos: Vector3) {
    this._locationVector.copy(pos);
    this.ref.positionVector = this._locationVector;
  }

  get locationVector(): Vector3 {
    return this._locationVector;
  }

	public customStyles(): Set<string> {
		/**None**/
    return new Set();
	}
	public accept(v: Visitor): boolean {
    if (!(v instanceof TextMoverVisitor)) return false;
    console.log("Accepting TextMoverVisitor.");
    return v.actionOnText(this);
	}
	public get noduleItemText(): string {
		/**None**/
    return this.text;
	}
	public get noduleDescription(): string {
		/**None**/
    return "";
	}
  // Getter for the private variable text
  public getText(): string {
    return this.text;
}

public setText(newText: string): void {
  this.text = newText;
  this.ref.twoJsText = newText; // Update the Two.js text instance
}
}
