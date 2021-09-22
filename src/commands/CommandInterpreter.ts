import EventBus from "@/eventHandlers/EventBus";
import { SENodule } from "@/models/SENodule";
import { AddAntipodalPointCommand } from "./AddAntipodalPointCommand";
import { AddCircleCommand } from "./AddCircleCommand";
import { AddIntersectionPointCommand } from "./AddIntersectionPointCommand";
import { AddLineCommand } from "./AddLineCommand";
import { AddPerpendicularLineThruPointCommand } from "./AddPerpendicularLineThruPointCommand";
import { AddPointCommand } from "./AddPointCommand";
import { AddPointOnOneDimensionalCommand } from "./AddPointOnOneOrTwoDimensionalCommand";
import { AddSegmentCommand } from "./AddSegmentCommand";
import { Command } from "./Command";
import { CommandGroup } from "./CommandGroup";
import { AddCalculationCommand } from "./AddCalculationCommand";
import { AddPointCoordinateMeasurementCommand } from "./AddPointCoordinateMeasurementCommand";
import { AddPointDistanceMeasurementCommand } from "./AddPointDistanceMeasurementCommand";
import { AddLengthMeasurementCommand } from "./AddLengthMeasurementCommand";
import { ConstructionScript } from "@/types";
import { AddEllipseCommand } from "./AddEllipseCommand";
import { AddPolarPointCommand } from "./AddPolarPointCommand";
import { AddParametricCommand } from "./AddParametricCommand";
import { AddParametricEndPointsCommand } from "./AddParametricEndPointsCommand";
import { AddParametricTracePointCommand } from "./AddParametricTracePointCommand";
import { AddAngleMarkerCommand } from "./AddAngleMarkerAndExpressionCommand";
import { AddPolygonCommand } from "./AddPolygonAndExpressionCommand";
import { AddTangentLineThruPointCommand } from "./AddTangentLineThruPointCommand";
import { AddNSectLineCommand } from "./AddNSectLineCommand";
import { AddNSectPointCommand } from "./AddNSectPointCommand";
import { AddPolarLineCommand } from "./AddPolarLineCommand";
import { AddSliderMeasurementCommand } from "./AddSliderMeasurementCommand";
const noduleDictionary = new Map<string, SENodule>();

function executeIndividual(command: string): Command {
  const andPosition = command.indexOf("&");
  if (andPosition < 0) {
    const errMsg = `Invalid command format: ${command}`;
    EventBus.fire("show-alert", {
      key: errMsg,
      type: "error"
    });
    throw new Error(errMsg);
  }
  const opCode = command.substring(0, andPosition);
  // Use exact comparison (and not startsWith) because a command name
  // can be a prefix of another command name
  // (example: AddPoint and AddPointOnOneDimensional)
  switch (opCode) {
    case "AddPoint":
      return AddPointCommand.parse(command, noduleDictionary);
    case "AddPointOnOneDimensional":
      return AddPointOnOneDimensionalCommand.parse(command, noduleDictionary);
    case "AddIntersectionPoint":
      return AddIntersectionPointCommand.parse(command, noduleDictionary);
    case "AddSegment":
      return AddSegmentCommand.parse(command, noduleDictionary);
    case "AddLine":
      return AddLineCommand.parse(command, noduleDictionary);
    case "AddCircle":
      return AddCircleCommand.parse(command, noduleDictionary);
    case "AddEllipse":
      return AddEllipseCommand.parse(command, noduleDictionary);
    case "AddAntipodalPoint":
      return AddAntipodalPointCommand.parse(command, noduleDictionary);
    case "AddPolarPoint":
      return AddPolarPointCommand.parse(command, noduleDictionary);
    case "AddPolarLine":
      return AddPolarLineCommand.parse(command, noduleDictionary);
    case "AddPerpendicularLineThruPoint":
      return AddPerpendicularLineThruPointCommand.parse(
        command,
        noduleDictionary
      );
    case "AddTangentLineThruPoint":
      return AddTangentLineThruPointCommand.parse(command, noduleDictionary);
    case "AddAngleMarker":
      return AddAngleMarkerCommand.parse(command, noduleDictionary);
    case "AddPolygon":
      return AddPolygonCommand.parse(command, noduleDictionary);
    case "AddPointCoordinateMeasurement":
      return AddPointCoordinateMeasurementCommand.parse(
        command,
        noduleDictionary
      );
    case "AddPointDistanceMeasurement":
      return AddPointDistanceMeasurementCommand.parse(
        command,
        noduleDictionary
      );
    case "AddLengthMeasurement":
      return AddLengthMeasurementCommand.parse(command, noduleDictionary);
    case "AddCalculation":
      return AddCalculationCommand.parse(command, noduleDictionary);
    case "AddParametric":
      return AddParametricCommand.parse(command, noduleDictionary);
    case "AddParametricEndPoints":
      return AddParametricEndPointsCommand.parse(command, noduleDictionary);
    case "AddParametricTracePoint":
      return AddParametricTracePointCommand.parse(command, noduleDictionary);
    case "AddNSectPoint":
      return AddNSectPointCommand.parse(command, noduleDictionary);
    case "AddNSectLine":
      return AddNSectLineCommand.parse(command, noduleDictionary);
    case "AddSliderMeasurement":
      return AddSliderMeasurementCommand.parse(command, noduleDictionary);
    default: {
      const errMsg = `Not yet implemented: ${command}`;
      EventBus.fire("show-alert", {
        key: `Not yet implemented ${errMsg}`,
        type: "error"
      });
      throw new Error(errMsg);
    }
  }
}

/**
 * Reinterpret the command from its script.  The incoming argument
 * is either a string or an array of strings
 *
 * @param command a string that represents a single command or
 *   an array of strings that represents a command group
 */
function interpret(command: string | Array<string>): void {
  if (typeof command === "string") {
    /* This is an individual command */
    executeIndividual(command).execute();
  } else {
    // This is a CommandGroup, interpret each command individually
    const group = new CommandGroup();
    command
      // Remove leading and training quotes
      .map((s: string) => s.replace(/^"/, "").replace(/"$/, ""))
      .forEach((c: string /*, gPos: number*/) => {
        group.addCommand(executeIndividual(c));
      });
    // Then execute as a group
    group.execute();
  }
}

export function run(script: ConstructionScript): void {
  // Reset the command history before interpreting a new script
  noduleDictionary.clear();
  Command.commandHistory.splice(0);
  Command.redoHistory.splice(0);
  script.forEach((s: string | Array<string>) => {
    interpret(s);
  });
}
