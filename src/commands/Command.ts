/** This class uses the Command Design Pattern to
 * wrap actions into objects.
 * The most important abstract method of this class is the `do()`
 * method, it performs the action wrapped by the object
 *
 * In order to support undo feature, each command must also
 * implement the restoreState() method to revert the effects of the action.
 * The constructor of every subclass must take the arguments needed to perform
 * the actual action of the command.
 */

import EventBus from "@/eventHandlers/EventBus";
import { Vector3 } from "three";
import { SEStoreType } from "@/stores/se";
export abstract class Command {
  protected static store: SEStoreType;
  protected static tmpVector = new Vector3();
  protected static tmpVector1 = new Vector3();

  //#region commmandArrays
  static commandHistory: Command[] = []; // stack of executed commands
  static redoHistory: Command[] = []; // stack of undone commands
  //#endregion commmandArrays

  //eslint-disable-next-line
  protected lastState: any; // The state can be of ANY type

  //#region undo
  static undo(): void {
    if (Command.commandHistory.length === 0) return;
    // Pop the last command from the history stack
    const lastAction: Command | undefined = Command.commandHistory.pop();
    console.log("undo last", lastAction);
    // Run is restore state logic
    if (lastAction) {
      Command.redoHistory.push(lastAction);
      lastAction.restoreState();
    }
    // Update the free points to update the display so that individual command and visitors do
    // not have to update the display in the middle of undoing or redoing a command (this middle stuff causes
    // problems with the move *redo*)
    Command.store?.updateDisplay();
    EventBus.fire("undo-enabled", { value: Command.commandHistory.length > 0 });
    EventBus.fire("redo-enabled", { value: Command.redoHistory.length > 0 });
    this.store.updateSelectedSENodules([]);
  }
  //#endregion undo

  static undoEnabled = (): boolean => Command.commandHistory.length > 0;
  static redoEnabled = (): boolean => Command.redoHistory.length > 0;

  //#region redo
  static redo(): void {
    if (Command.redoHistory.length === 0) return;
    const nextAction = Command.redoHistory.pop();

    if (nextAction) {
      nextAction.execute(true);
    }
    // Update the free points to update the display so that individual command and visitors do
    // not have to update the display in the middle of undoing or redoing a command (this middle stuff causes
    // problems with the move *redo*)
    Command.store?.updateDisplay();
  }
  //#endregion redo

  execute(fromRedo?: boolean): void {
    // Keep this command in the history stack
    Command.commandHistory.push(this);
    this.saveState(); /* Allow the command to save necessary data to restore later */
    this.do(); /* perform the actual action of this command */

    /**
     * Suppose you create a segment from point A to B, then you move point B to location C, then push
     * undo, this moves the operation "move point from B to C" onto the redo stack and moves the point to location B
     * Now suppose you either
     *
     *    A) Delete the point at point B
     *
     *    B) Move the point from B to location D and create a circle with center the point at D and point on at A
     *
     * What happens when you push redo?
     *
     * In case A, you are trying to move a point that doesn't exist resulting in an error
     * In case B, you end up with a circle with center C and point on it A, which is strange behavior
     *
     * For this reason(A), it seems to me that when you issue a delete command, the redo stack should be cleared and
     * for (B), if you issue any new command while there is something on the redo stack, the redo stack should be cleared
     * But don't clear the redo stack if the new command is from a redo action
     */
    if (Command.redoHistory.length > 0 && fromRedo === undefined) {
      Command.redoHistory.splice(0);
    }

    EventBus.fire("undo-enabled", { value: Command.commandHistory.length > 0 });
    EventBus.fire("redo-enabled", { value: Command.redoHistory.length > 0 });
  }

  /** Just memorize the command without actually executing it */
  push(): void {
    Command.commandHistory.push(this);
    this.saveState();

    //The reasons for this block of code are above
    if (Command.redoHistory.length > 0) {
      Command.redoHistory.splice(0);
    }

    EventBus.fire("undo-enabled", { value: Command.commandHistory.length > 0 });
    EventBus.fire("redo-enabled", { value: Command.redoHistory.length > 0 });
  }

  /**
   * Convert all the commands in the history to textual operation code
   * @returns
   */
  static dumpOpcode(): string {
    const out = Command.commandHistory
      .map(c => c.toOpcode()) // convert each command in the history to its string representation
      .filter(z => z !== null); // but include only non-null output
    return JSON.stringify(out);
  }

  static dumpSVG():string {

    // create a style dictionary
    //  (key: id - this would be an object name concat a number like point0,
    // value: [dictionary with keys: name of attribute, value: string of attribute]
    //
    // key: name of attribute (string)
    // fill
    // fill-opacity default is 1? so if the opacity is specified in the fill color, the fill color determines the opacity
    // stroke
    // stroke-width
    // stroke-opacity default is 1? so if the opacity is specified in the fill color, the fill color determines the opacity
    // stroke-linecap
    // stroke-linejoin
    // stroke-miterlimit
    // stroke-dasharray
    // stroke-dashoffset
    // font-family
    // font-size
    // line-height
    // text-anchor
    // dominant-baseline
    // font-style
    // font-weight
    // text-decoration
    // direction
    //
    // value:
    //   value of attribute (string) -- how do I indicate the default value for each of these attributes?
    //
    //  Initially contains the style of the boundary circle

    // create an layer dictionary (key: layer number, like 0 (of type number) corresponding to
    //
    // backgroundAngleMarkers,0 --> contains only angle markers (edges and fill)
    // backgroundFills,3 --> contains circles (fills only), ellipse (fills only), polygon
    // background,4 --> contains lines, segments, circles (edges only), parametric, ellipse, edges only
    // backgroundPoints,6 --> only contains points
    // backgroundText,8 --> only contains labels
    // midground,9 --> contains only the boundary circle
    // foregroundAngleMarkers,11 --> contains only angle markers (edges and fill)
    // foregroundFills,13 --> contains circles (fills only), ellipse (fills only), polygon
    // foreground,14 --> contains lines, segments, circles (edges only), parametric, ellipse, edges only
    // foregroundPoints,16 --> only contains points
    // foregroundText, 18 --> only contains labels
    //   (notice all the glowing layers have been removed - the SVG export doesn't include any glowing objects)
    //
    // value: [dictionary with keys: type of object values: ])
    //
    // key: type of object (string)
    // point
    // line
    // segment
    // circle
    // polygon
    // angleMarker
    // ellipse
    // parametric
    // labels
    //
    // value is a dictionary of the keys (id-- from creation in SENodule like SENodule.id (node count)) values: list of the 1) the style id and 2) SVG code for that object (includes matrix)
    //
    // Don't include visibility - all items are visible if they are in the
    //
    //  Initially contains the boundary circle in the midground layer

    // for each command pass the style dictionary and the layer dictionary to the object, the toSVG method in each object adds it self to the layer dictionary and its style to the style dictionary

    // Use the style dictionary to create a string style sheet object that contains selectors like
    // point0 { stroke: blue; stroke-width: 0.7642135452; fill: none} // don't include attributes that default correctly
    //
    // Use the layer dictionary to create is an SVG of the current scene object
    //
    //
    // The id of each layer is the name of the layer (from LAYER enum ,like backgroundAngleMarkersGlowing)
    // The id of each object in a layer is name of object being display - part xx (there are three parts possible for segment, two for )



    return "blah"
  }

  static setGlobalStore(store: SEStoreType): void {
    Command.store = store;
  }
  // Child classes of Command must implement the following abstract methods
  /**
   * restoreState: Perform necessary action to restore the app state.
   * The operation(s) implemented in restoreState() are usually opposite of the
   * operation(s) implemented in do()*/
  abstract restoreState(): void;

  // TODO: consider merging saveState() and do(). They are always invoked one after the other

  /** saveState: Save require information to restore the app state*/
  /**
   * The saveState() method allows a particular command to save necessary information needed for undoing when restoreState()  is invoked (later on). And saveState() is invoked before do() in case the command requires to use/retrieve information before the action itself takes place. One example that I can think of now: let’s say we will implement ChangeLineWidthCommand and its saveState() method would be able to query the current line width before it changes the line width to a new value.
   */
  abstract saveState(): void;

  /**  do: Perform necessary action to alter the app state*/
  abstract do(): void;

  /** Generate an opcode ("assembly code") that can be saved as an executable script
   * and interpreted at runtime by calling the constructor of Command subclasses.
   * The generated opcode shall include sufficient details for invoking the constructor.
   *
   * @returns Several possible return values:

   * - A simple command shall return a string
   * - A command group shall return an array of string (one string per command in the group)
   * - A command that should be excluded/ignored during interpretation at runtime
   *   shall return null
   */

  abstract toOpcode(): null | string | Array<string>;

  // remove the &, / and & from a string and replace with hex equivalent / -> %47, = -> , and & -> %38
  static symbolToASCIIDec(inputString: string | undefined): string {
    if (inputString === undefined) {
      return "";
    }
    if (inputString.match(/%61|%47|%38|%64/)) {
      console.error(
        `Save Command: Forbidden pattern %61, %47, %38, or %64 found in string ${inputString}`
      );
    }
    return inputString
      .replaceAll("@", "%64")
      .replaceAll("=", "%61")
      .replaceAll("/", "%47")
      .replaceAll("&", "%38");
  }
  static asciiDecToSymbol(inputString: string): string {
    return inputString
      .replaceAll("%38", "&")
      .replaceAll("%47", "/")
      .replaceAll("%61", "=")
      .replaceAll("%64", "@");
  }
}
