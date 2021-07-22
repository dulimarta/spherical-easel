---
title: Design Document
prev: /tools/edit.md
---

# Spherical Easel Design Document

## Overview

We have chosen to break apart the code so that we can implement different code design patterns. Many of the different parts are schematically indicated in this image and some of the interactions are described in it. The information flow and code execution starts from the top where the application collects user input and then decides how to process it.

![An image](/InformationFlowAndCodeExectution.png)

To display and organize information for a graphical object (like an ellipse) on the Sphere Canvas requires two different types of methods: those for rendering it to the screen (including the size, color, fill, portion on the front or back, etc.) and those for keeping track of where this object is located on the sphere and how this object interacts with other objects (location, parents or kids of an object, etc.). This distinction is reflected in the organization of the classes and the directory structure. The classes in the <span class="directory">plottables</span> directory (like <span class="class">Ellipse</span>) all pertain to graphical rendering of objects and classes in the <span class="directory">models</span> directory (like <span class="class">SEEllipse</span>) pertain to the location and how the object should respond to changes in location of its parents. We are using something like the [façade design pattern](https://en.wikipedia.org/wiki/Facade_pattern) where the front facing graphics are handled by classes in the <span class="directory">plottables</span> directory which mask the more complex (abstract) behaviors handled by classes in the <span class="directory">models</span> directory. We do this so that if a better graphical renderer comes to the attention of the authors we will be able to change to that new renderer (fairly) easily.

## Adding a tool

Here is an outline of how you can expand Spherical Easel and [add a tool](/design/addingatooloutline.md).

## Models Directory

Models are the back-end collection of classes that organize and store information about each graphical object on the [ideal unit sphere](/design/#coordinates). Classes in this directory should be independent of the graphical library chosen for rendering the visual appearance of the geometric objects. All classes in this directory starts with the prefix SE. This is to distinguish them from their plottable counterparts. For instance, <span class="class">SECircle</span> in this subdirectory is associated with the class <span class="class">Circle</span> that resides in the <span class="directory">plottables</span> directory. Notice that multiple <span class="class">SENodule</span> classes (the super class of all the classes in this directory) can be associated with the same class in the <span class="directory">plottables</span> directory. For example, the <span class="class">SEThreePointCircle</span> is also associated with the class <span class="class">Circle</span> in the <span class="directory">plottables</span> directory.

Each Model class contains a reference (called <span class="variable">ref</span>) to the corresponding graphical object that lives in the plottables subdirectory. There should be no methods/functions or variables that invoke the routines of the rendering/graphical tools (i.e. <span class="package">[two.js](https://two.js.org/)</span> currently) except <span class="variable">ref</span> the pointer to the rendering class.

The files in this directory manage the fixed (abstract) unit sphere location information and the [data structure](/design/#data-structure) for these geometric objects. All of the classes in this directory extend <span class="class">SENodules</span>. This gives them access to the following methods and variables:

- <span class="method">registerChild(SENodule)</span> and <span class="method">unRegisterChild()</span>: Methods for adding newly created (or removing old) objects to or from the [data structure](/design/#data-structure).
- <span class="variable">exists</span>: A boolean flag to declare if this SENodule exists or not. For example, if the user intersection two circles (like point $P_6$ in the [data structure](/design/#data-structure) below) and then moves the circle apart, the <span class="variable">exists</span> flag switches from true to false, but the <span class="class">SEPoint</span> object is not deleted. This way if the user moves the circle back into positions where the intersection point exists, the point (and all of the objects it depends on) reappear.
- <span class="variable">outOfDate</span>: A boolean flag to indicate that the SENodule is out of date and needs to be updated.
- <span class="method">markKidsOutOfDate()</span>: A recursive methods to mark all descendants (kids, grand kids, etc.) of the current SENodule out of date.
- <span class="variable">showing</span>: A boolean flag to indicate if the user has hidden the object.

A typical constructor for a <span class="class">SENodule</span> class is like the one for <span class="class">SECircle</span>:

<<< @/src/models/SECircle.ts#circleConstructor

The first argument is the corresponding plottables object (which assigned to the <span class="variable">ref</span> variable) and the rest are the <span class="class">SENodule</span> objects that it depends on (which immediately register the <span class="class">SECircle</span> object being created).

There are some abstract methods in <span class="class">SENodules</span> that must be overridden by each class extending it. Those include:

- <span class="method">update()</span>: A typical implementation of this method follows this outline
  - Check to see if all the parents of this <span class="class">SENodule</span> are not <span class="variable">outOfDate</span>. If any are, then return without doing anything, knowing that this method will be called again on this object because the last line of this method would have to be called on all outOfDate parents.
  - Update the location or other information for this <span class="class">SENodule</span>. For example, if this is an <span class="class">SEIntersectionPoint</span> of two circles, this is where we would recalulate the location of this intersection point.
  - End with the method <span class="method">updateKids()</span> that updates all kids of this <span class="class">SENodule</span>.
- <span class="method">isHitAt(Vector)</span>: Takes an input of a location on the unit ideal sphere and decides if that location is close enough to this object that the user would like to select or highlight it.

### Naming Convention

For any variable in a model class, that has an associated setter or getter, the private version starts with an underscore and the setter or getter version doesn't have an underscore. If the variable is an SE object of some type the two letter sequence SE is in the name.

### Object State

Every <span class="class">SENodule</span> object has the following boolean properties:

- <span class="variable">\_exists</span>: A object doesn't exist if any one of its parents don't exist or its geometric definition indicates that it doesn't exist. For example, an intersection point of two circles exists if the two circles cross, but if the user moves the circle far enough apart, the intersection won't exist. In this case the <span class="variable">\_exists</span> variable would go from true to false. If the user moves the circle back into position where the two circles intersect, then the <span class="variable">\_exists</span> is back to true (and the point is redisplayed). Note that any objects that depend on this intersection are not lost during this process, they merely don't exist and are not displayed while in this state.

- <span class="variable">\_showing</span>: A user can hide or show objects and this variable reflects that state.

- <span class="variable">\_outOfDate</span>: If an object needs to be updated because its parents may have changed, then this flag is set to true.

- <span class="variable">\_selected</span>: If an object is selected it remains glowing until it is unselected. This property is used to indicate to the user which objects have already been selected when multiple objects need to be selected for an operation.

- <span class="variable">\_isUserCreated</span>: (This property applies to only <span class="class">SEIntersectionPoint</span> objects.) Every time you add a one dimensional object all intersections with all other one dimensional objects are created as <span class="class">SEIntersectionPoint</span> objects. See <span class="class">intersectTwoObjects()</span> method in the <span class="class">getters.ts</span> in the [Store](/design/#store). When they are created in this way, the value of <span class="variable">\_isUserCreated</span> is false. When this value is false, mousing over an intersection will make it display in the temporary style instead of glowing. If the user actually uses the point in a construction, <span class="variable">\_isUserCreated</span> is true and mousing over it will make it glow as usual. See <span class="command">ConvertInterPtToUserCreatedCommand</span>.

## Plottables Directory

Plottable classes are the front-end collection of classes that organize and display graphical representations of objects on the [ideal unit sphere](/design/#coordinates). Classes in this directory should only receive updates and information from the <span class="class">SENodule</span> classes to which they are associated. While there are over 40 <span class="class">SENodule</span> classes (one for each [geometric tool](/userguide/toolsobjectspanel.html#tools-tab)), there are only about 10 graphically rendered objects and each has its own class in the <span class="directory">plottables</span> directory. This [spreadsheet](https://docs.google.com/spreadsheets/d/1o0s0l-offb5uPaimqiIyfVzv22wsuXrKBfjXbZHzxl8/edit?usp=sharing) contains a list of the <span class="class">SENodule</span> classes and their corresponding <span class="class">Nodule</span> classes. The plottable classes are

- <span class="class">Point</span>
- <span class="class">NonFreePoint</span>
- <span class="class">Segment</span>
- <span class="class">Line</span>
- <span class="class">Circle</span>
- <span class="class">CircleArc? (part of Circle?)</span>
- <span class="class">Ellipse</span>
- <span class="class">AngleMarker</span>
- <span class="class">Polygon</span>
- <span class="class">Text? Label?</span>
- <span class="class">ParametricCurve</span>

Each of these classes is responsible for

- rendering the visual appearance, including size, color, line style, shading, etc. of the object. This appearance depends on whether the object (or part of the object) is on the front or back of the sphere and the zoom magnification factor.
- managing the portions of the object that should be displayed on the front and back of the sphere.
- managing the doppelgänger objects that are displayed to make the object appear to glow (i.e. is selected by the user).

Each of these classes extends the <span class="class">Nodule</span> class and this gives them access to the following abstract methods:

- <span class="method">addToLayers(layers:Two.Group[])</span>: This method places all of the graphical objects of this object into the appropriate layers so that the display is rendered appropriately. For example, a point on the back of the sphere is not drawn on top of a circle that is on the front of the sphere.
- <span class="method">removeFromLayers()</span>: This reverses the operation of <span class="method">addToLayers()</span>.
- <span class="method">adjustSize(factor: number)</span>: This method is called every time the Zoom Magnification Factor is changed ([see Zooming And Panning for details](/design/#zooming-and-panning)) and allows us to set the display size of points and linewidth of one-dimensional objects so that more detailed views are possible. That is, zooming the view doesn't result in a very large point that obscures other details.
- <span class="method">normalDisplay()</span>: Running this method sets the rendering (i.e. actual view) style of the actually displayed object to the style where the object is not selected or highlighted. It doesn't change the style of the object (that is the method <span class="method">stylize(UPDATE)</span>), but is merely a unidirectional switch to set the display to normal. This method will be called many times during a construction.
- <span class="method">glowingDisplay()</span>: This method is like <span class="method">normalDisplay()</span> except it sets the actual display to a glowing style to indicate that the user has moused over or selected an object. This method will be called many times during a construction. Note: To make an object glow, a second identically-located object is displayed under the original object ([see Layers](/design/#layers)), but with a slightly larger size or line width but colored differently. This is why all the graphical variables in each <span class="class">Nodule</span> class have two versions: a glowing version and a regular one. For example, in the <span class="class">Circle</span> the variable <span class="variable">backVertices</span> has an identically located <span class="variable">glowingBackVertices</span> version. The prefix glowing indicates this.
- <span class="method">stylize(flag: DisplayStyle)</span>: This method allows the application to two things:

  - Set up a style. That is, indicate that the object being created is temporary one or to set up the glowing style. So that when it is actually displayed the correct look and feel is displayed.
  - Change the display style. That is, allow the user to change the an aspect of the display (i.e change a color).

  The <span class="class">Nodule</span> objects are used in multiple ways indicate by the <span class="variable">DisplayStyle</span> flag. This flag is an [enum](https://www.typescriptlang.org/docs/handbook/enums.html) that can have the following values:

  - TEMPORARY - This styling used when the object is being created by a [handler](/design/#event-handlers) or has not yet been created by the user. For example, when the user mouses over an intersection point that has not yet been used in an arrangement but was automatically calculated. This style is not modifiable by the user. This method will be called only once on a <span class="class">Nodule</span> object.
  - GLOWING - This sets up the style of the glowing objects, so that when an object is set to <span class="method">glowingDisplay()</span> the glowing objects are rendered correctly. This style is not modifiable by the user. This method will be called only once on a <span class="class">Nodule</span> object.
  - DEFAULT - This sets the style of the object back to the defaults. That is, if the user has made some style changes (say a new color) to objects but changes their mind, the application uses this option to revert the objects back to the defaults that were initially used. This style is not modifiable by the user. This method will be called as many times as the user wants to reset the style on a <span class="class">Nodule</span> object.
  - UPDATE - This sets the style of the object to the variables in object. This allows styles to be applied to an object after the user has made a change. For example, if the user selects a line color of blue in the [Style Panel](/userguide/stylepanel.html) the variable <span class="variable">strokeColorFront</span> of that particular line is set to this choice and <span class="method">stylize(UPDATE)</span> is used to apply that choice to the graphical object. This method will be called as many times as the user wants to change the style on a <span class="class">Nodule</span> object.

- <span class="method">setVisible(flag: boolean)</span>: This turns on or off the visibility of the <span class="class">Nodule</span> object.

Linking a <span class="class">Nodule</span> object and its corresponding <span class="class">SENodule</span> object is typically done as follows:

1. Create the <span class="class">Nodule</span> object (s) with the empty constructor
2. Stylize the newly created plottable object(s).
3. Create the <span class="class">SENodule</span> object using the newly created plottable(s) in the constructor.
4. Set the unit sphere properties (if any) of the <span class="class">SENodule</span> object

This is illustrated in this code snippet from <span class="file">PointHandler.ts</span>:

<<< @/src/eventHandlers/PointHandler.ts#linkNoduleSENodule

### Naming Convention

For any variable in a plottables class the must be set before the plottable can be properly rendered, the private version of it starts with an underscore and the setter/getter version has the same name with out the underscore. If the variable is a vector of some type the last word of the name is Vector.

## Layers

Layers are an integral part of the rendering process. The renderer (currently from the <span class="package">[two.js](https://two.js.org/)</span> package) needs to draw objects in a sensible way so that all objects on the front (positive Z-coordinate) of the sphere are rendered on top of all objects on the back of the sphere (negative Z-coordinate). This leads to the <span class="variable">background</span> and <span class="variable">foreground</span> prefixes in the [enum](https://www.typescriptlang.org/docs/handbook/enums.html) variable <span class="variable">LAYER</span>. However, even objects the front of the sphere need to be rendered in the appropriate order. For example, <span class="variable">foregroundPoints</span> must be rendered on top of the <span class="variable">foreground</span> one-dimensional objects, but under the <span class="variable">foregroundText</span>. All glowing objects must be rendered under their corresponding non-glowing versions, so for every type of object to be displayed there is a second glowing version of that layer.

The complete list of values for enum <span class="variable">LAYER</span> each describe the layer that it numbers:

<<< @/src/global-settings.ts#layers

Each enum value correspond to a <span class="class">Two.Group</span> (i.e. layer) inside the main <span class="variable">twoInstance</span> which is created in <span class="file">SphereFrame.vue</span>. Pointers to these layers are stored in the private <span class="variable">layers</span> variable in <span class="file">SphereFrame.vue</span>. In turn the <span class="variable">layers</span> variable is passed to all [Event Handlers](/design/#event-handlers) so that the objects they create can be placed in the appropriate layers. In the following code we can see that after creating the group in the <span class="variable">twoInstance</span>, the pointer is stored in the <span class="variable">layers</span> variable, and the $y$ axis is flipped on all layers except the text layers.

<<< @/src/components/SphereFrame.vue#addlayers

## Rendering Objects

The unit sphere is a 3-dimensional object that we must project into 2-dimensions to render on the screen. Rather than use a package like <span class="package">[three.js](https://threejs.org/)</span> in which we could specify an object in 3-dimensions and have the package render it (by choosing a camera location, a light source, near and far planes, etc.), we chose to use a simpler orthographic projection that we could implement ourselves. We chose the $XY$-plane to be the _image plane_ and the $Z$-axis to be the camera axis (with positive $Z$ pointing towards the viewer).
As one of the main goals of this project was to draw simple, clean, and labeled geometric diagrams on both the screen and paper, we chose the package that best supported that goal. The 3-dimensionality and shading of objects produced using <span class="package">[three.js](https://threejs.org/)</span> made it difficult to render clearly the one-dimensional objects that make up the bulk of our geometric arrangements.

As explained above, the classes in the [Models Directory](/design/#models-directory) store information about geometric objects on the ideal unit sphere and the classes in the [Plottables Directory](/design/#plottables-directory) are responsible for methods to
render the geometric objects to the screen. This process of going from the ideal unit sphere to the screen is handled in stages. The following diagrams helps to organize this process.

<tik-z-picture latex="coordinates.tex"></tik-z-picture>

First the unit sphere information is scaled to be on the Default Sphere. The default radius of the sphere (which is the same as the black boundary circle seen in the Default Screen Plane) was arbitrarily fixed at 250 (the default radius is in pixels if the Zoom Magnification Factor is 1) as set in the <span class="file">global-settings.ts</span> file:

<<< @/src/global-settings.ts#boundarycircle

To determine the location of a point on the ideal unit sphere in the Default Screen Plane, we first scale its position vector by the default radius, and then orthographically project by simply dropping the $z$ coordinate. The sign of the $z$ coordinate indicates if the point is rendered in a style that indicates that it is on the back of the sphere or the front. This process is used repeatedly to draw one-dimensional geometric objects. In general, the rendering follows this outline:

1. Create a transformation matrix (<span class="class">Matrix4</span>) that maps the object of the correct size in a standard position (say centered at the North Pole) to the current view of the object on the unit ideal sphere. For example, this is how it is done for circles:

<<< @/src/plottables/Circle.ts#circleDisplay

2. Transform a sampling of points on the object in standard position to the current view.
3. Using the steps above, transform the current view points to the Default Screen Plane, keeping track of if they should be rendered in a style for the front or back.
4. Group the points that should be rendered on the front of the sphere into a front path and similarity for the back.
5. Render the front and back paths to the sphere.

In general the rendering process is more complex than this. For example, consider the case of a segment that is longer than $\pi$. It may start on the front, continue on the back for a length of $\pi$ and then reappear on the front again. In this case, the set of points that should be rendered to the front (or back) comes in two discrete paths that must be rendered separately. In general, we have tried to avoid creating or deleting any of the vectors that make up an objects so that the number of points used to display an object is constant and vectors can go from being in a front path to a back path to ensure an equitable distribution of vectors tracing out the object.

## Zooming and Panning

Zooming and panning are accomplished using a CSS (affine) transform applied to the **root** SVG object that the renderer produces. Once an object has been [rendered on the Default Screen Plane](/design/#rendering-objects), the CSS transform displays it in the Viewport (see the illustration in the [Rendering Objects](/design/#rendering-objects) section) using a Zoom Magnification Factor and a Zoom Translation Vector. (Note: In the case that Zoom Magnification Factor is 1 and the Zoom Translation Vector is $\langle 0, 0 \rangle$ the Viewport is the same as the Default Screen Plane.) There are two ways that the user can zoom and pan.

1. Using a track pad or mouse wheel. These trigger the <span class="method">handleMouseWheelEvent(MouseEvent)</span> method in the <span class="file">SphereFrame.vue</span> file.
2. Using the [Zooming and Panning Tools](/tools/display.html#zoom-pan-and-standard-view). This fires a <span class="string">"zoom-update"</span> [EventBus](/design/#event-bus) action.

In both cases the new Zoom Magnification Factor and Translation Vector are written to the [Store](/design/#store) (triggering a resize of the plottables - outlined below) and the <span class="method">updateView()</span> method in the <span class="file">SphereFrame.vue</span> file (see below) is eventually executed which sets the new CSS Affine Transformation -- which is alway a uniform scaling and translation and never a shear.

<<< @/src/components/SphereFrame.vue#updateView{9}

When we zoom we control the size of the displayed geometric objects so that the text size, stroke width, point size, etc. do not become so large as to obscure other details in the arrangement. To account for the magnification factor in the display, every class in the [Plottables Directory](/design/#plottables-directory) (i.e. all <span class="class">Nodule</span> classes) has a method called <span class="method">adjustSize()</span>. This method is called on all plottables through a chain of events that are outlined here.

Whenever a new magnification factor is computed the value is written to the [Store](/design/#store) with a dispatch command like the one highlighted in this code snippet from <span class="file">PanZoomHandler.ts</span>:

<<< @/src/eventHandlers/PanZoomHandler.ts#writeFactorVectorToStore{2}

The <span class="string">"setZoomMagnificationFactor"</span> <span class="method">dispatch(...)</span> method results in a <span class="method">commit(...)</span> of the magnification factor to the store and fires a <span class="string">"magnification-updated"</span> [Event Bus](/design/#event-bus) action.

<<< @/src/store/index.ts#magnificationUpdate

As the constructor for <span class="file">Easel.vue</span> contains a listener for the <span class="string">"magnification-updated"</span> [EventBus](/design/#event-bus) action.

<<< @/src/views/Easel.vue#magnificationUpdate

this action calls

<<< @/src/views/Easel.vue#resizePlottables{3,6}

which calls <span class="method">adjustSize()</span> on all plottable retrieved from the from the [Store](/design/#store).

## Data Structure

The geometric objects in any arrangement are associated to an abstract data structure. The data structure is a directed acyclic graph (DAG). The vertices of the graph are the geometric objects and the arrows of the graph point from one object to another, if the location of the second object depends on the location of the first object. For example, suppose the user creates the following geometric arrangement:

- Four points, $P_1, P_2, P_3, P_4$, on the sphere.
- A circle, $C_1$, with center point $P_1$ and edge point $P_2$.
- A circle, $C_2$, with center point $P_3$ and edge point $P_4$.
- A line segment, $S_1$, from point $P_1$ to new point $P_5$ that is constrained to be on $C_2$.
- One of the intersection points, $P_6$, of $C_1$ and $C_2$.

As the location of first four points created are not constrained by any other geometric objects (except the surface of the sphere, of course), the vertices in the DAG corresponding to these points have no incoming arrows and are called **free points**. Point $P_5$, and any point that is only constrained to be located on any one-dimensional object, is also considered to free. Any object that is free or only depends on free points is considered to be a **free object**. Free objects are individually movable with the [Move Tool](/tools/display.html#move).

To determine the rest of the DAG, consider what changes as we move these points. If the user moves $P_1$ then $C_1$ also moves, so there is an arrow in the DAG from the vertex corresponding to $P_1$ to the vertex corresponding to $C_1$. Similarly segment $S_1$ also moves so there is an arrow between the vertices corresponding to those objects. Continuing in this way we obtain the following DAG where the round green circles correspond to free objects (i.e. individually moveable with the [Move Tool](/tools/display.html#move)) and the red rectangles correspond to fixed objects (i.e. unmovable with the [Move Tool](/tools/display.html#move)):

<tik-z-picture latex="directed_graph.tex"></tik-z-picture>

The DAG associated to any geometric arrangement is used to determine which objects need to be refreshed when other objects change their location. For example, if point $P_1$ is moved, then only those objects that depend on $P_1$ (i.e. all descendents $C_1$, $P_6$, and $S_1$) need to be refreshed.

Notice that this DAG depends on the location of the objects. So for example, if the user moves the points in such a way that the circles that depend on them do not intersect, then the vertex corresponding to $P_6$ doesn't exist in the arrangement and so its corresponding vertex is no longer in the DAG. (Note that any object that is a descendent of an object that doesn't exist also doesn't exist.)

The arrows in the the DAG are programmatically declared and organized using the <span class="variable">parents</span> and <span class="variable">kids</span> array found in the <span class="class">SENodule</span> class. For example, the <span class="variable">parents</span> array of $P_6$ would contain pointers to circles $C_1$ and $C_2$ and its <span class="variable">kids</span> array would be empty. The only pointer in the both $C_1$ and $C_2$ <span class="variable">kids</span> array would be one to $P_6$. See the discussion in the [Models Directory](/design/#models-directory) for more information about how this structure is used and handled programmatically.

[Note that all directed acyclic graph can be layered.](https://link.springer.com/content/pdf/10.1007/3-540-45848-4_2.pdf)

## User Interface (Vue Components and Views)

Still in development so write up later.

## Event Handlers

The handlers decide how to handle user mouse and keyboard input to implement a particular tool. A handler class is instantiated as a tool.

```js
this.selectTool = new SelectionHandler(this.layers);
```

All handlers implement the interface <span class="interface">ToolStrategy</span>:

<<< @/src/eventHandlers/ToolStrategy.ts#toolStrategy{2-7}

The <span class="method">activate()</span> and <span class="method">deactivate()</span> methods are run at the eponymous times during the life cycle of the tool. The <span class="method">activate()</span> method processes all the [selected objects](/tools/edit.html#selection) and decides whether or not to execute the appropriate tool routines. The <span class="method">deactivate()</span> method clears the appropriate variable in the tool so that they don't interfere with the execution of other tools.

Almost all handlers extend <span class="class">Highlighter</span> which itself extends <span class="class">MouseHandler</span> (the exception is <span class="class">PanZoomHandler</span>). This means that almost all handlers have access to the following variables that are computed in the <span class="method">mouseMoved()</span> method.

- <span class="variable">currentSphereVector</span>: This the <span class="class">Vector3</span> location on the ideal unit sphere corresponding to the current mouse location. (Set in <span class="class">MouseHandler</span>)
- <span class="variable">previousSphereVector</span>: This the <span class="class">Vector3</span> location on the ideal unit sphere of corresponding to the previous mouse location. (Set in <span class="class">MouseHandler</span>)
- <span class="variable">currentScreenVector</span>: This the <span class="class">Two.Vector</span> location in the Default Screen Plane of the current mouse location. (Set in <span class="class">MouseHandler</span>)
- <span class="variable">previousScreenVector</span>: This the <span class="class">Two.Vector</span> location in the Default Screen Plane of the previous mouse location. (Set in <span class="class">MouseHandler</span>)
- <span class="variable">isOnSphere</span>: This boolean variable indicates if the current mouse location is inside the boundary circle in the Default Screen Plane (Set in <span class="class">MouseHandler</span>)

In addition, the <span class="method">mouseMoved()</span> method (in <span class="class">Highlighter</span>) queries (via the getters) the [Store](/design/#store) to find all the nearby objects. The variable <span class="variable">hitNodules</span> is an array of nearby SEObjects that is sorted into the different class like <span class="variable">hitPoints</span>, <span class="variable">hitSegments</span>, <span class="variable">hitLines</span>, etc. all of which are available to the children of <span class="class">Highlighter</span>. It is the job of each handle to highlight/glow all the objects that it can properly interact with.

### Move Handler

Move handler allows the user to select free objects. (See the discussion in the [Date Structure](/design/#data-structure) section for the definition of a free object.) This means that the <span class="method">mousePress()</span> selects the object to move, <span class="method">mouseMoved()</span> does the actual moving, and <span class="method">mouseRelease()</span> records a command group that allows the user to undo the move. Undoing a move is not a straight forward operation and involves more than just returning points to their original positions.

For example, if the user moves a line segment from being less than $\pi$ in length to being greater than $\pi$ in length, the endpoints of the segment themselves do not store this information so moving them back to their original positions doesn't undo this move. Another example is moving a circle, with a point on it (<span class="class">PointOnOneDimensional</span>). If the user moves the circle, the point on it moves, by finding the closest point on the circle to the old location. This process is not reversed by merely restoring the centerSEPoint and circleSEPoint to their original locations.

Therefore to undo a move, we must store the before and after locations of any object that depends on the moved points including

- Any free point (including <span class="class">PointOnOneDimensional</span>)
- The normal vector to the plane containing the line. (If the points on the line are antipodal, moving the line changes only the normal vector)
- The segment normal vector and arcLength. (If the points on the line segment are antipodal, moving the line segment changes only the normal vector and as discussed above, the arcLength is not captured by the points.)

Note that in the process of undoing the locations of the parent points of circles, line segments and lines are restored first, so we don't need to store the locations of the points that help define lines or line segments. Also circles are completely determined by the center and circle points so we don't have to store any information about them.

To help store the information necessary for undoing a move we use the <span class="method">update(beforeMoveState)</span> method where

<<< @/src/eventHandlers/MoveHandler.ts#beforeSaveState

This allows us use the <span class="method">update</span> method to update the <span class="variable">stateArray</span> to record any information that is necessary to restore the state of the object being updated. For example, on <span class="class">SEPoint</span> and <span class="class">SEPointOnOneDimensional</span> we have

<<< @/src/models/SEPoint.ts#saveState

This stores the location of the point and not a pointer to the location which would not change during the move! Note that the <span class="method">update</span> method does a topological sort on the directed acyclic graph [Data Structure](/design/#data-structure) (but _only_ if the <span class="class">markKidsOutOfDate()</span> method is called first on the object) so the parents of an object are updated before the object itself. Thus the point parents of a one dimensional object are correctly updated before the one ddimensional object itself. Therefore it is not necessary to store any information about the object that is not captured by the parent points and will be restored with a <span class="method">update</span> display only method call like

<<< @/src/eventHandlers/MoveHandler.ts#displayOnlyUpdate

Hence nothing is stored in the <span class="variable">stateArray</span> for <span class="class">SECircle</span> or <span class="class">SEIntersectionPoint</span> classes. Once the before and after <span class="variable">stateArray</span> has been created, the <span class="class">MoveHandler</span> creates a command group to store all the move points, lines and segments commands. The <span class="command">MovePointCommand</span>, <span class="command">MoveLineCommand</span>, and <span class="command">MoveSegmentCommand</span> classes issue mutations
to the store which then uses [Visitors](/design/#visitor-and-event-bus-actions) to actually change the location of points, normal vectors of lines and line segments, and arc length of line segments. The <span class="type">ObjectSaveState</span> type and the interfaces like <span class="interface">LineSaveState</span>, <span class="interface">SegmentSaveState</span>, <span class="interface">PointSaveState</span> in the <span class="directory">types</span> directory give an idea of the information that must be stored in order to undo a <span class="method">move</span>

## Commands

We record each change in the application using a <span class="class">Command</span> object. This allows use to implement a [Command Design Pattern](https://en.wikipedia.org/wiki/Command_pattern). This pattern allows us to easily implement the [Undo and Redo Tool](/tools/edit.html#undo-redo) and ultimately the Load and Save features of the application. Every user action that changes the state of the application is implemented by a <span class="class">Command</span> object.

The <span class="class">Command</span> class contains several static variables including

<<< @/src/commands/Command.ts#commmandArrays

The <span class="variable">commandHistory</span> array stores a stack of commands that are used to get from the initial application state to the current state of the application. The <span class="variable">redoHistory</span> stores a stack of the latest commands that have been redone. These arrays are managed by two static methods:

<<< @/src/commands/Command.ts#undo

and

<<< @/src/commands/Command.ts#redo

Each instance of the <span class="class">Command</span> class has access to the following methods:

- <span class="method">execute()</span>:
  - Puts the command instance in the <span class="variable">commandHistory</span> stack
  - Forces the command instance to save necessary data to restore later (via <span class="method">saveState()</span>)
  - Forces the command instance to perform the actual action of instance command (via <span class="method">do()</span>)
- <span class="method">push()</span>:
  - Does the same thing as <span class="method">execute()</span> except for actually preforming the command.
  - This is used for [Zooming and Panning](/design/handlers/display.html#zoom-pan-and-standard-view) which are events that are executed directly based on immediate user input and only when undone or redone are executed by a command instance.

All Child classes of Command must implement the following abstract methods

- <span class="method">restoreState()</span>: Perform necessary action to restore the app state. The operation(s) implemented in here are usually opposite of the operation(s) implemented in <span class="method">do()</span>.
- <span class="method">saveState()</span>: Save require information to restore the app state
- <span class="method">do()</span>: Perform necessary action to alter the app state

For example, to add a point to the state of the application, the [PointHandler](/design/handlers/basic.html#point) gathers mouse input and creates the [linked <span class="class">Point</span> and <span class="class">SEPoint</span> objects](/design/#plottables-directory). Then it creates a <span class="class">AddPointCommand</span> object using the <span class="class">SEPoint</span> object in the constructor. This code snippet from <span class="file">AddPointCommand.ts</span> shows this

<<< @/src/commands/AddPointCommand.ts#addPointCommand

The <span class="method">do()</span> and <span class="method">restoreState()</span> methods uses the <span class="string">"addPoint"</span> and <span class="string">"removePoint"</span> mutations of the application state found in the [Store](/design/#store). The <span class="string">"addPoint"</span> mutation is implemented in the [Store](/design/#store) as follows.

<<< @/src/store/se-module.ts#addPoint

This simply pushes the <span class="class">SEPoint</span> into the appropriate arrays in the store and then adds the corresponding plottables objects to the layers in the store. (TODO: Why does it do this?)

When the user performs a sequence of changes to the app, sometimes we do not want each individual change to be undone. For example, if the Mouse Wheel or [Zooming and Panning Tool](/tools/display.html#zoom-pan-and-standard-view) is used to [zoom or pan](/design/#zooming-and-panning), they may execute thirty or forty small zooms and undoing a large number of small zooms is very tedious. In this case we only push only one Command onto the stack: one that takes the starting view and transforms it to final view. In this case the entire zooming or panning operation is undone with one <span class="method">undo()</span> command. However, this is not always possible and sometimes we use a <span class="class">CommandGroup</span> object to group a sequence of <span class="class">Command</span> objects together, each of which needs to be undone separately, but can be executed as batch.

For example, when creating a circle the user may create a new center point, new circle point, and finally a new circle depending on both of these objects. In the <span class="file">CircleHandler.ts</span> file the <span class="method">makeCircle()</span> method starts creating a <span class="class">CommandGroup</span> object

```ts
const circleGroup = new CommandGroup();
```

and then creates (and styles) a new circle <span class="class">Point</span> object which is linked to a new <span class="class">SEPoint</span> object and is finally added to the circleGroup command.

```ts
const newCenterPoint = new Point();
// Set the display to the default values
newCenterPoint.stylize(DisplayStyle.DEFAULT);
// Set up the glowing display
newCenterPoint.stylize(DisplayStyle.GLOWING);
const newSECenterPoint = new SEPoint(newCenterPoint);
newSECenterPoint.vectorPosition = this.centerVector;
this.centerSEPoint = newSECenterPoint;
circleGroup.addCommand(new AddPointCommand(newSECenterPoint));
```

Finally, after a similar operation for the circle <span class="class">Point</span>, a new <span class="class">SECircle</span> is added to the command group

```ts
const newSECircle = new SECircle(
  newCircle,
  this.centerSEPoint,
  this.circleSEPoint
);

circleGroup.addCommand(new AddCircleCommand(newSECircle));
```

and finally the <span class="class">CommandGroup</span> object is executed

```ts
circleGroup.execute();
```

## Store

This application uses a [Vuex Store](https://vuex.vuejs.org/) to implement a [State Management Pattern](https://en.wikipedia.org/wiki/State_management). This serves as single place to record the state of the app and to change (mutate) that state in predictable ways. It is a repository for all the important variables in the application that can be accessed.
Using the builtin framework provided by the `vuex-store` package, the store is organized into the following four main components

1. State variables (read-only access)
2. Mutation functions to modify the state variable synchronously
3. Action functions to modify the state variable asynchronously
4. The getter functions that provide computed properties built from several state variables.

The above components are declared as the following top-level object structure:


```ts
{
  state: {
    /* declaration of all the state variables */
  },
  mutations: {
    /* declaration of all the synchronous mutation functions */
  },
  actions: {
    /* declaration of all the asynchronous action functions */
  },
  getters: {
    /* declaration of all the getter functions */
  }
}
```

Unfortunately, `vuex-store` does not provide a type safe syntax for invoking the mutation or action functions, since function names are passed
as a string to the `commit` function (to invoke a mutation) or to the `dispatch` function (to invoke an action).
A minor typo in the function name will fail to call the intended function.

To avoid this issue, we added another library that wraps these functions into typesafe aliases. We first experimented with the `direct-vuex` library but encountered build warning messages related to circular references used by the `direct-vuex` function wrapper.
To solve the issue, in commit [bccf383](https://gitlab.com/hans.dulimarta/sphericalgeometryvue/-/commit/bccf383a247ef60b0d8eebb5c4f966b43d75c72b) we migrated from `direct-vuex` to `vuex-module-decorator`. This new library requires use of (sub)modules.
Currently, we have only one module defined in `src/store/se-module.ts`:

<<< @/src/store/se-module.ts#SEModuleHeader

Modules are defined under the `modules` property (in `@/store/index.ts`) as shown below:


<<< @/src/store/index.ts#storeRoot


:::warning IMPORTANT
The `name` property defined at the `@Module` annotation must match the property name (`se`) defined under the `modules` property.
:::


The `vuex-module-decorator` library automatically convert any class properties/variables into `vuex-store` state variables.
Currently, we have the following as the store state variables:

<<< @/src/store/se-module.ts#appState

Mutation functions must be annotated with `@Mutation`:

<<< @/src/store/se-module.ts#addPoint

Likewise, action functions must be annotated with `@Action`. Currently we use none.

Any functions defined as JavaScript getter automatically become `vuex-store` getter

:::tip
TypeScript requires getter functions take no arguments. To provide a getter function that takes argument, we depend on 
function composition and currying. Essentially, we make the getter function to return a function that takes the arguments.
In the following snippet we have a getter function `findNearbySENodules` that takes two arguments and returns an array of `SENodule`.
By returning a function with such signature, the getter function itself requires no parameter.
:::

<<< @/src/store/se-module.ts#findNearbyGetter

The `SEStore` exported name provides a type safe syntax (as well as editor auto completion) to the state variables, mutation, action, and getter functions. Examples:

```ts
import {SEStore} from "@/store"

// Later in code
const ctr = new SEPoint(/* args here */)
const radius = SEStore.sphereRadius;  // this accesses the state variable sphereRadius
SEStore.addPoint(ctr);                // this invokes the `addPoint` mutation function
SEStore.findNearbySENodule(queryPoint, scrPos); // invokes the getter function
```

As opposed to the unsafe call below:

```ts
this.$store.commit('addPoint', ctr);
```

:::tip
`SEStore` can be used in Vue Components as well as ordinary TypeScript files, giving a consistent type safe call syntax
throughout the app.
:::

To enforce **read-only** syntax when accessing the store state variables from Vue component we rely on the state mapping provided by `vuex-class`
and combine it with readonly keyword in Typescript:

<<< @/src/App.vue#activeToolName

where the prefix `SE` is defined using the `namespace` function provided by `vuex-module-decorator`.

<<< @/src/App.vue#vuex-module-namespace

In the [Zooming and Panning](/design/#zooming-and-panning) section, the reader might have noticed that the Zoom Translation Vector is written to the [Store](/design/#store) with a <span class="method">commit(...)</span> method and the Zoom Magnification Factor is written with a <span class="method">dispatch(...)</span> method. This is because the the <span class="method">commit(...)</span> operation is a synchronous one and the <span class="method">dispatch</span> operation is an asynchronous one. The setting of the translation vector is immediately completed as a mutation of the store, but updating the magnification factor triggers an [update of all the plottable objects](/design/#zooming-and-panning) which shouldn't interrupt the programmatic control flow and can happen asynchronously.

## Visitor and Event Bus Actions

The <span class="class">Visitor</span> class allows one class access to another class's private variables in a controlled way. <span class="class">EventBus</span> actions allow non-Vue components to communicate with Vue components in an asynchronous way. For example, the [Rotation Tool](/tools/display.html#rotation) uses both of these classes in crucial way.

The [Rotation Handler](/design/handlers/display.html#rotation) uses the user mouse input to compute a Change In Position Rotation Matrix that maps the Unit Ideal Sphere to itself (see the illustration in the [Rendering Objects](/design/#rendering-objects) section). This fires a <span class="string">"sphere-rotate"</span> [EventBus](/design/#event-bus) action as shown in this snippet from <span class="file">RotateHandler.ts</span>:

<<< @/src/eventHandlers/RotateHandler.ts#sphereRotate

The <span class="string">"sphere-rotate"</span> [EventBus](/design/#event-bus) listener is in <span class="file">SphereFrame.vue</span>. Notice how an events outside of the Vue Component (in the handler) is now triggering an event in a Vue Component. This listener calls

<<< @/src/components/SphereFrame.vue#handleSphereRotation

The <span class="string">"rotateSphere"</span> mutation of the application state is as follows

<<< @/src/store/se-module.ts#rotateSphere

Notice that this creates a <span class="class">RotationVisitor</span> based on the Change In Position Rotation Matrix and that is applied to all SEPoint via this snippet from <span class="file">RotationVisitor.ts</span>:

<<< @/src/visitors/RotationVisitor.ts#actionOnPoint

The <span class="class">RotationVisitor</span> merely updates all other <span class="class">SENodule</span> objects. Notice how the sequence of triggered event is now outside of the Vue Components again, but has been accessed in the Store along the way. Also notice how the <span class="class">RotationVisitor</span> marks the kids of each point out of date before called the <span class="method">update</span> method.

## Stylizing Objects

When the user opens the [Style Panel](/userguide/stylepanel.html) a set of options (in the form of four expansion panels: Basic, Foreground, Background, and Advanced) appears on the right side of the canvas, the [Tools and Object Panel](/userguide/toolsobjectspanel.html) is minimized, the active tool is set to the <span class="tool">Selection</span> tool, and the undo and redo buttons are disabled. This is because the user should only be styling objects and not creating new ones (and each option on the style panel has an <span class="button">Undo</span> button).

### Fore- and Back-ground Panels

The user can select items to style before entering the Styling Mode (the mode where the Style Panel is open and the others are minimized). The selected items are imported in the <span class="method">mount()</span> and passed to the <span class="method">OnSelectionChange()</span> method. This method is run when ever there is a change in the selection

```ts
@Watch("selectedSENodules")
  onSelectionChanged (newSelection: SENodule[]): void {
```

This method then checks to see if there are any style changes that need to be stored in the command stack so they can be undone later. If there is a non-empty selection, the `initialStyleState` and `defaultStyleState` of the selected objects (for front and back) is recorded in these variables in the Vuex store. 

<<< @/src/components/FrontBackStyle.vue#setStyle

Upon <span class="method">setXXXSelectorState()</span> method being executed, the program first determines the common style options (e.g.: `fillColor`, `strokeColor`, etc.) shared by all the selected objects.
This information is stored in an array which is accessed by the
 <span class="method">hasXXX()</span> function to control the visibility of relevant <span class="component">fade-in-card</span>. 
 The program then checks to see if the value of that style is the same across all selected objects. If it is not, the <span class="variable">XXXAgreement</span> variable is set to <span class="component">false</span> and an overlay panel saying "Differing Styles Detected -- Override" is displayed. If the user clicks that button, the <span class="variable">XXXAgreement</span> variable is set to <span class="component">true</span> and any style selection will set that one style property of all selected objects to be the same. Once a selection is made the <span class="button">Undo</span> button is activated, and by clicking it all selected objects will revert that style property back to the style they had when they were _selected_. Clicking the <span class="button">Apply Defaults</span> button will revert the selected objects back to their default style.

The big picture idea is that to update the display of an object. The

```ts
updateStyle(mode: StyleEditPanels, options: StyleOptions): void</span>
```

method records the new style choices in the variables of the plottable class. Then the

```ts
this.stylize(DisplayStyle.APPLYCURRENTVARIABLES);
this.adjustSize();
```

commands apply the newly updated variables to the actual TwoJS objects so that they are rendered to the screen. This way the current style state of the plottable is readable with the

```ts
currentStyleState(mode: StyleEditPanels): StyleOptions {
```

method which returns the current value of each style variable.

The background panel has slightly different options because of the <span class="variable">dynamicBackStyle</span> variable. When this variable is set many of the styles for the back side display are automatically calculated based on the value of <span class="variable">Nodule.backStyleContrast</span> variable (always between 0 and 1) and the methods

```ts
static contrastFillColor(frontColor: string): string {
static contrastStrokeColor(frontColor: string): string {
static contrastOpacity(frontOpacity: number): number {
static contrastStrokeWidthPercent(frontPercent: number): number {
static contrastPointRadiusPercent(frontPercent: number): number
```

found in the <span class="class">Nodule</span> class. The idea is that if <span class="variable">Nodule.backStyleContrast</span> is equal to one there is essentially no difference between front and back styling and if equal to zero almost nothing appears on back of sphere for colors and size reduction is maximized. The background panel always displays a slider for adjusting <span class="variable">Nodule.backStyleContrast</span> and the results are automatically displayed on the screen in real time. The other option is the enable/disable the <span class="variable">dynamicBackStyle</span> for the selected objects (each object has its own copy of the <span class="variable">dynamicBackStyle</span> variable). If <span class="variable">dynamicBackStyle</span> is true, the only way to adjust the styling (except for dash pattern) is via the <span class="variable">Nodule.backStyleContrast</span> slider. If <span class="variable">dynamicBackStyle</span> is false, then the common style for the selected objects is adjustable with the styling options that appear.

## Languages

Spherical Easel uses the [Vue I18n internationalization plugin for Vue.js](https://kazupon.github.io/vue-i18n/api/#extension-of-vue). If you are interested in helping translate this program into another language, please (TODO: add a link)

```

```
