import EventBus from "@/eventHandlers/EventBus";
import { SENodule } from "@/models/SENodule";
import { AddAntipodalPointCommand } from "./AddAntipodalPointCommand";
import { AddCircleCommand } from "./AddCircleCommand";
import { AddIntersectionPointCommand } from "./AddIntersectionPointCommand";
import { AddLineCommand } from "./AddLineCommand";
import { AddPerpendicularLineThruPointCommand } from "./AddPerpendicularLineThruPointCommand";
import { AddPointCommand } from "./AddPointCommand";
import { AddEarthPointCommand } from "./AddEarthPointCommand";
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
import { AddThreePointCircleCenterCommand } from "./AddThreePointCircleCenterCommand";
import { AddMeasuredCircleCommand } from "./AddMeasuredCircleCommand";
import { AddTranslationCommand } from "./AddTranslationCommand";
import { AddRotationCommand } from "./AddRotationCommand";
import { AddReflectionCommand } from "./AddReflectionCommand";
import { AddInversionCommand } from "./AddInversionCommand";
import { AddPointReflectionCommand } from "./AddPointReflectionCommand";
import { AddTransformedPointCommand } from "./AddTransformedPointCommand";
import { AddIsometrySegmentCommand } from "./AddIsometrySegmentCommand";
import { AddIsometryLineCommand } from "./AddIsometryLineCommand";
import { AddIsometryCircleCommand } from "./AddIsometryCircleCommand";
import { AddIsometryEllipseCommand } from "./AddIsometryEllipseCommand";
import { AddInvertedCircleCenterCommand } from "./AddInvertedCircleCenterCommand";
import { AddIntersectionPointOtherParent } from "./AddIntersectionPointOtherParent";
import { RemoveIntersectionPointOtherParent } from "./RemoveIntersectionPointOtherParent";
import { DeleteNoduleCommand } from "./DeleteNoduleCommand";
import { ChangeIntersectionPointPrincipleParent } from "./ChangeIntersectionPointPrincipleParent";
import { SetNoduleDisplayCommand } from "./SetNoduleDisplayCommand";
import { SetValueDisplayModeCommand } from "./SetValueDisplayModeCommand";
import { SetEarthModeCommand } from "./SetEarthModeCommand";
import { AddLatitudeCommand } from "./AddLatitudeCommand";
import { AddLongitudeCommand } from "./AddLongitudeCommand";
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
    case "AddIntersectionPointOtherParent":
      return AddIntersectionPointOtherParent.parse(command, noduleDictionary);
    case "RemoveIntersectionPointOtherParent":
      return RemoveIntersectionPointOtherParent.parse(
        command,
        noduleDictionary
      );
    case "AddLongitude":
      return AddLongitudeCommand.parse(command, noduleDictionary);
    case "AddLatitude":
      return AddLatitudeCommand.parse(command, noduleDictionary);
    case "AddEarthPoint":
      return AddEarthPointCommand.parse(command, noduleDictionary);
    case "AddSegment":
      return AddSegmentCommand.parse(command, noduleDictionary);
    case "AddLine":
      return AddLineCommand.parse(command, noduleDictionary);
    case "AddCircle":
      return AddCircleCommand.parse(command, noduleDictionary);
    case "AddMeasuredCircle":
      return AddMeasuredCircleCommand.parse(command, noduleDictionary);
    case "AddEllipse":
      return AddEllipseCommand.parse(command, noduleDictionary);
    case "AddThreePointCircleCenter":
      return AddThreePointCircleCenterCommand.parse(command, noduleDictionary);
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
    case "AddTranslation":
      return AddTranslationCommand.parse(command, noduleDictionary);
    case "AddRotation":
      return AddRotationCommand.parse(command, noduleDictionary);
    case "AddReflection":
      return AddReflectionCommand.parse(command, noduleDictionary);
    case "AddPointReflection":
      return AddPointReflectionCommand.parse(command, noduleDictionary);
    case "AddInversion":
      return AddInversionCommand.parse(command, noduleDictionary);
    case "AddTransformedPoint":
      return AddTransformedPointCommand.parse(command, noduleDictionary);
    case "AddIsometrySegment":
      return AddIsometrySegmentCommand.parse(command, noduleDictionary);
    case "AddIsometryLine":
      return AddIsometryLineCommand.parse(command, noduleDictionary);
    case "AddIsometryCircle":
      return AddIsometryCircleCommand.parse(command, noduleDictionary);
    case "AddIsometryEllipse":
      return AddIsometryEllipseCommand.parse(command, noduleDictionary);
    case "AddInvertedCircleCenter":
      return AddInvertedCircleCenterCommand.parse(command, noduleDictionary);
    case "DeleteNodule":
      return DeleteNoduleCommand.parse(command, noduleDictionary);
    case "ChangeIntersectionPointPrinciplePoint":
      return ChangeIntersectionPointPrincipleParent.parse(
        command,
        noduleDictionary
      );
    case "SetNoduleDisplay":
      return SetNoduleDisplayCommand.parse(command, noduleDictionary);
    case "SetEarthMode":
      return SetEarthModeCommand.parse(command, noduleDictionary);
    case "SetValueDisplayMode":
      return SetValueDisplayModeCommand.parse(command, noduleDictionary);

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
export function interpret(command: string | Array<string>): void {
  if (Array.isArray(command)) {
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
  } else {
    /* This is an individual command */
    executeIndividual(command).execute();
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
