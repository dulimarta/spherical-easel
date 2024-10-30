import { ObjectState } from "@/types";
import i18n from "@/i18n";
import { SENodule } from "./SENodule";
import { Vector3 } from "three";
import SETTINGS from "@/global-settings";
import { Visitor } from "@/visitors/Visitor";
import TextTool from "@/plottables/TextTool";
const { t } = i18n.global;

export class SEText extends SENodule {
	public declare ref: TextTool //<- plottable Text

	private x: number;// x, y coordinates
	private y: number;
	private text: string;// string text

	constructor(txt:string, x:number, y:number) {
		super();
		this.text = txt;
		this.x = x;
		this.y = -y;
    console.log(`SEText.x = ${this.x}, SEText.y = ${this.y}`);
    const textTool = new TextTool(this.text, this.x, this.y, this.name);
    this.ref = textTool;
	}

	public shallowUpdate(): void {
		//Something goes here
	}

	public update(
    objectState?: Map<number, ObjectState>,
    orderedSENoduleList?: number[]
    ): void {
    	//Something goes here
	}

  // implement for MOVE tool
	public isHitAt(unitIdealVector: Vector3, currentMagnificationFactor: number): boolean {
    return false;
	}
	public customStyles(): Set<string> {
		/**None**/
    return new Set();
	}
	public accept(v: Visitor): boolean {
		/**None**/
    return false;
	}
	public get noduleItemText(): string {
		/**None**/
    return "";
	}
	public get noduleDescription(): string {
		/**None**/
    return "";
	}

}
