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
		this.y = y;
    const textTool = new TextTool(this.name);
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

	public isHitAt(unitIdealVector: Vector3, currentMagnificationFactor: number): boolean {
		throw new Error("Method not implemented.");
	}
	public customStyles(): Set<string> {
		throw new Error("Method not implemented.");
	}
	public accept(v: Visitor): boolean {
		throw new Error("Method not implemented.");
	}
	public get noduleItemText(): string {
		throw new Error("Method not implemented.");
	}
	public get noduleDescription(): string {
		throw new Error("Method not implemented.");
	}

}
