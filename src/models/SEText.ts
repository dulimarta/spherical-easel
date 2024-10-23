import { ObjectState } from "@/types";
import i18n from "@/i18n";
import { Vector3 } from "three";
import SETTINGS from "@/global-settings";
const { t } = i18n.global;

export class SEText extends SENodule {
	// public declare ref: Text <- plottable Text
	// x, y coordinates
	// string text
	
	public shallowUpdate(): void {
		//Something goes here
	}

	public update(
    objectState?: Map<number, ObjectState>,
    orderedSENoduleList?: number[]
    ): void {
    	//Something goes here
	}
}
