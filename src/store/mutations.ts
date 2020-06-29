import { AppState } from "@/types";
import Two from "two.js";
import { SEPoint } from "@/models/SEPoint";
import { Matrix4 } from "three";
import { SESegment } from "@/models/SESegment";
import { SECircle } from "@/models/SECircle";
import { PositionVisitor } from "@/visitors/PositionVisitor";
import { SELine } from "@/models/SELine";
const tmpMatrix = new Matrix4();

export const initialState: AppState = {
  sphereRadius: 0,
  editMode: "rotate",
  // slice(): create a copy of the array
  transformMatElements: tmpMatrix.elements.slice(),
  // nodes: [], // Possible future addition (array of SENodule)
  nodules: [],
  layers: [],
  points: [],
  lines: [],
  segments: [],
  circles: [],
  intersections: []
};

const positionVisitor = new PositionVisitor();

export default {
  init(state: AppState): void {
    state = { ...initialState };
  },
  setLayers(state: AppState, layers: Two.Group[]): void {
    state.layers = layers;
  },
  setSphereRadius(state: AppState, radius: number): void {
    state.sphereRadius = radius;
  },
  setEditMode(state: AppState, mode: string): void {
    state.editMode = mode;
  },
  addPoint(state: AppState, point: SEPoint): void {
    state.points.push(point);
    state.nodules.push(point);
    point.ref.addToLayers(state.layers);
  },
  removePoint(state: AppState, pointId: number): void {
    const pos = state.points.findIndex(x => x.id === pointId);
    const pos2 = state.nodules.findIndex(x => x.id === pointId);
    if (pos >= 0) {
      state.points[pos].ref.removeFromLayers();
      state.points[pos].removeSelfSafely();
      state.points.splice(pos, 1);
      state.nodules.splice(pos2, 1);
    }
  },
  addLine(
    state: AppState,
    {
      line,
      startPoint,
      endPoint
    }: { line: SELine; startPoint: SEPoint; endPoint: SEPoint }
  ): void {
    state.lines.push(line);
    state.nodules.push(line);
    line.ref.addToLayers(state.layers);

    // Add this line as a child of the two points
    startPoint.registerChild(line);
    endPoint.registerChild(line);
    // determineIntersectionsWithLine(state, line);
  },
  removeLine(state: AppState, lineId: number): void {
    const pos = state.lines.findIndex(x => x.id === lineId);
    const pos2 = state.nodules.findIndex(x => x.id === lineId);
    if (pos >= 0) {
      /* victim line is found */
      const victimLine = state.lines[pos];
      victimLine.ref.removeFromLayers();
      victimLine.removeSelfSafely();
      state.lines.splice(pos, 1); // Remove the line from the list
      state.nodules.splice(pos2, 1);
    }
  },
  addSegment(
    state: AppState,
    {
      segment,
      startPoint,
      endPoint
    }: { segment: SESegment; startPoint: SEPoint; endPoint: SEPoint }
  ): void {
    state.segments.push(segment);
    state.nodules.push(segment);
    startPoint.registerChild(segment);
    endPoint.registerChild(segment);
    segment.ref.addToLayers(state.layers);
  },
  removeSegment(state: AppState, segId: number): void {
    const pos = state.segments.findIndex(x => x.id === segId);
    const pos2 = state.nodules.findIndex(x => x.id === segId);
    if (pos >= 0) {
      const victim = state.segments[pos];
      victim.ref.removeFromLayers();
      victim.removeSelfSafely();
      state.segments.splice(pos, 1);
      state.nodules.splice(pos2, 1);
    }
  },
  addCircle(
    state: AppState,
    {
      circle,
      centerPoint,
      circlePoint
    }: { circle: SECircle; centerPoint: SEPoint; circlePoint: SEPoint }
  ): void {
    state.circles.push(circle);
    state.nodules.push(circle);
    circle.ref.addToLayers(state.layers);
    centerPoint.registerChild(circle);
    circlePoint.registerChild(circle);
  },
  removeCircle(state: AppState, circleId: number): void {
    const circlePos = state.circles.findIndex(x => x.id === circleId);
    const pos2 = state.nodules.findIndex(x => x.id === circleId);
    if (circlePos >= 0) {
      /* victim line is found */
      const victimCircle: SECircle = state.circles[circlePos];
      victimCircle.ref.removeFromLayers();
      victimCircle.removeSelfSafely();
      state.circles.splice(circlePos, 1); // Remove the line from the list
      state.nodules.splice(pos2, 1);
    }
  },
  rotateSphere(state: AppState, rotationMat: Matrix4) {
    positionVisitor.setTransform(rotationMat);
    state.points.forEach((p: SEPoint) => {
      p.accept(positionVisitor);
    });
    state.lines.forEach((l: SELine) => {
      l.accept(positionVisitor);
    });
    state.circles.forEach((l: SECircle) => {
      l.accept(positionVisitor);
    });
    state.segments.forEach((s: SESegment) => {
      s.accept(positionVisitor);
    });
  }
};
