declare module "two.js/extras/jsm/arc" {
    /**
     * @name Two.Arc
     * @class
     * @extends Two.Path
     * @param {Number} [x=0] - The x position of the arc.
     * @param {Number} [y=0] - The y position of the arc.
     * @param {Number} [width=0] - The width, horizontal diameter, of the arc.
     * @param {Number} [height=0] - The height, vertical diameter, of the arc.
     * @param {Number} [startAngle=0] - The starting angle of the arc in radians.
     * @param {Number} [endAngle=6.283] - The ending angle of the arc in radians.
     * @param {Number} [resolution=4] - The number of vertices used to construct the circle.
     */
    class Arc extends Path {
        constructor(x?: number, y?: number, width?: number, height?: number, startAngle?: number, endAngle?: number, resolution?: number);
        /**
        * @name Two.Arc#width
        * @property {number} - The horizontal size of the arc.
        */
        width: number
        /**
       * @name Two.Arc#height
       * @property {number} - The vertical size of the arc.
       */
        height: number

        /**
       * @name Two.Arc#startAngle
       * @property {number} - The angle of one side for the arc segment.
       */
        startAngle: number

        /**
       * @name Two.Arc#endAngle
       * @property {number} - The angle of the other side for the arc segment.
       */
        endAngle: number

        /**
         * @name Two.Arc.Properties
        * @property {String[]} - A list of properties that are on every {@link Two.Arc}.
        */
        properties: string[]

        /**
        * @name Two.Arc#clone
        * @function
        * @param {Two.Group} [parent] - The parent group or scene to add the clone to.
        * @returns {Two.Arc}
        * @description Create a new instance of {@link Two.Arc} with the same properties of the current path.
        */
        clone(): Arc
    }
    import { Path } from "two.js/src/path";
}
