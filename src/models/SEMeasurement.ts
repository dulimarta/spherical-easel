import { SENodule } from "./SENodule";
import { SEExpression } from "./SEExpression";

let MEASUREMENT_COUNT = 0;
export abstract class SEMeasurement extends SEExpression {
  constructor() {
    super();
    MEASUREMENT_COUNT++;
    this.name = `M-${MEASUREMENT_COUNT}`;
  }
}
