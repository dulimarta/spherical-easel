---
title: Design Document
next: /design/handlers/
prev: /tools/edit.md
---

# Spherical Easel Design Document

## Overview

To display and organize information for a graphical object (like an ellipse) on the Sphere Canvas requires two different types of methods: those for rendering it to the screen (including the size, color, fill, portion on the front or back, etc.) and those for keeping track of where this object is located on the sphere and how this objects interacts with other objects (location, parents or kids of an object, etc.). This distinction is reflected in the organization of the classes and the directory structure. The classes in the <span class="directory">plottables</span> directory (like <span class="class">Ellipse</span>) directory) all pertain to graphical rendering of objects and classes in the <span class="directory">models</span> directory (like <span class="class">SEEllipse</span>) directory) pertain to the location and how the object should respond to changes in location of its parents. We are using something like the [façade design pattern](https://en.wikipedia.org/wiki/Facade_pattern) where the front facing graphics are handled by classes in the <span class="directory">plottables</span> directory which mask the more complex (abstract) behaviors handled by classes in the <span class="directory">models</span> directory. We do this so that if a better graphical renderer comes to the attention of the authors we will be able to change to that new renderer (fairly) easily.

Handle user input....

## Models Directory

Models are the back-end collection of classes that organize and store information about each graphical object on the [ideal unit sphere](/design/#coordinates). Classes in this directory should be independent of the graphical library chosen for rendering the visual appearance of the geometric objects. All classes in this directory state with the prefix SE. This is to distinguish them from their plottable counterparts. For instance, <span class="class">SECircle</span> in this subdirectory is associated with the class <span class="class">Circle</span> that resides in the <span class="directory">plottables</span> directory. Notice that multiple <span class="class">SENodule</span> classes (the super class of all the classes in this directory) can be associated with the same class in the <span class="directory">plottables</span> directory. For example, the <span class="class">SEThreePointCircle</span> is also associated with the class <span class="class">Circle</span> in the <span class="directory">plottables</span> directory.

Each Model class contains a reference (called <span class="variable">ref</span>) to the corresponding graphical object that lives in the plottables subdirectory. There should be no uses (methods/functions or variables) that use the rendering/graphical tools (i.e. (<span class="package">[two.js](https://two.js.org/)</span> ) currently) except ref the pointer to the rendering class.

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
- <span class="method">isHitAt(sphereVector:</span> <span class="class">Vector3</span><span class="method">)</span>: Takes an input of a location on the unit ideal sphere and decides if that location is close enough to this object that the user would like to select or highlight it.

## Plottables Directory

Plottable classes are the front-end collection of classes that organize and display graphical representations of objects on the [ideal unit sphere](/design/#coordinates). Classes in this directory should only receive updates and information from the <span class="class">SENodule</span> classes to which they are associated. While there are over 40 <span class="class">SENodule</span> classes (one for each [geometric tool](/userguide/toolsobjectspanel.html#tools-tab)), there are only about 10 graphically rendered objects and each has its own class in the <span class="directory">plottables</span> directory. This [spreadsheet](https://docs.google.com/spreadsheets/d/1o0s0l-offb5uPaimqiIyfVzv22wsuXrKBfjXbZHzxl8/edit?usp=sharing) contains a list of the <span class="class">SENodule</span> classes and their corresponding <span class="class">Nodule</span> classes. The plottable classes are

- <span class="class">Point</span>
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

- <span class="method">addToLayers(layers)</span>: This method places all of the appropriate graphical objects into the appropriate layers so that the display is rendered appropriately. For example, a point on the back of the sphere is not drawn on top of a circle that is on the front of the sphere.
- <span class="method">removeFromLayers()</span>: This reverses the operation of <span class="method">addToLayers</span>.
- <span class="method">adjustSizeForZoom(factor: number)</span>: This method is called every time the Zoom Magnification Factor is changed ([See Coordinates for details.](/design/#coordinates)) and allows us to set the display size of points and linewidth of one-dimensional objects so that more detailed views are possible. That is, zooming the view doesn't result in a very large point that obscures other details.
- <span class="method">normalDisplay()</span>: This is the display style that is shown when an object is not selected or highlighted.
- <span class="method">glowingDisplay()</span>: This is the display style that is shown when an object is selected or highlighted. To make an object glow, a second identically-located object is displayed under the original object, but with a slightly larger size or width colored differently.
- <span class="method">stylize(flag: DisplayStyle)</span>: The <span class="class">Nodule</span> objects are used in multiple ways indicate by the <span class="variable">DisplayStyle</span> flag. This flag is an [enum](https://www.typescriptlang.org/docs/handbook/enums.html) that can have the following values:

  - TEMPORARY - this styling used when the object is being created by a [handler](/design/#event-handlers) or has not yet been created by the user. For example, when the user mouses over an intersection point that has not yet been used in an arrangement but was automatically calculated. This style is not modifiable by the user.
  - GLOWING - This sets the style of the glowing objects. This style is not modifiable by the user.
  - DEFAULT - This sets the style of the object back to the defaults. This style is not modifiable by the user.
  - UPDATE - This sets the style of the object to the variables in object. This allows styles to be applied to an object after the user has made a change. For example, if the user selects a line color of blue in the [Style Panel](/userguide/stylepanel.html) the variable <span class="variable">strokeColorFront</span> of that particular line is set to this choice and <span class="method">stylize(UPDATE)</span> is used to apply that choice to the graphical object.

- <span class="method">setVisible(flag: boolean)</span>: This turns on or off the display of the <span class="class">Nodule</span> object.

A typical constructor call to a Nodule is like....

## Layers

Layers are an integral part of the rendering process. The renderer (currently from the <span class="package">[two.js](https://two.js.org/)</span> package) needs to draw objects in a sensible way so that all objects on the front of the sphere are rendered on top of all objects on the back of the sphere. This leads to the <span class="variable">background</span> and <span class="variable">foreground</span> prefixes in the [enum](https://www.typescriptlang.org/docs/handbook/enums.html) variable <span class="variable">LAYER</span>. However, even objects the front of the sphere need to be rendered in the appropriate order. For example, <span class="variable">foregroundPoints</span> must be rendered on top of the <span class="variable">foreground</span> one-dimensional objects, but under the <span class="variable">foregroundText</span>. All glowing objects must be rendered under their corresponding non-glowing versions, so for every type of object to be displayed there is a second glowing version of that layer.

The complete list of values for enum <span class="variable">LAYER</span> each describe the layer that it numbers:

<<< @/src/global-settings.ts#layers

Each enum value correspond to a <span class="class">Two.Group</span> (i.e. layer) inside the main <span class="variable">twoInstance</span> which is created in <span class="file">SphereFrame.vue</span>. Pointers to these layers are stored in the private <span class="variable">layers</span> variable in <span class="file">SphereFrame.vue</span>. In turn the <span class="variable">layers</span> variable is passed to all [Event Handlers](/design/#event-handlers) so that the objects they create can be placed in the appropriate layers. In the following code we can see that after creating the group in the <span class="variable">twoInstance</span>, the pointer is stored in the <span class="variable">layers</span> variable, and the $y$ axis is flipped on all layers except the text layers.

@[code lang=ts linenumbers highlight={12-13} transcludeWith=:::](@/src/components/SphereFrame.vue)

<!-- <<< @/src/components/SphereFrame.vue#addlayers -->

## Rendering Objects

The unit sphere is a 3-dimensional object that we must project into 2-dimensions to render on the screen. Rather than use a package like <span class="package">[three.js](https://threejs.org/)</span> in which we could specify an object in 3-dimensions and have the package render it (by choosing a camera location, a light source, near and far planes, etc.), we chose to use a simpler orthographic projection that we could implement ourselves. As one of the main goals of this project was to draw simple, clean, and labeled geometric diagrams on both the screen and paper, we chose the package that best supported that goal. The 3-dimensionality and shading of objects produced using <span class="package">[three.js](https://threejs.org/)</span> made it difficult to render clearly the one-dimensional objects that make up the bulk of our geometric arrangements.

As explained above, the classes in the [Models Directory](/design/#models-directory) store information about geometric objects on the ideal unit sphere and the classes in the [Plottables Directory](/design/#plottables-directory) are responsible for methods to
render the geometric objects to the screen. This process of going from the ideal unit sphere to the screen is handled in stages. The following diagrams helps to organize this process.

<TikZPicture latex="coordinates.tex"></TikZPicture>

First the unit sphere information is scaled to be on the Default Sphere. The default radius of the sphere (which is the same as the black boundary circle seen in the Default Screen Plane) was arbitrarily fixed at 250 (the default radius is in pixels if the Zoom Magnification Factor is 1) as set in the <span class="file">global-settings.ts</span> file:

<<< @/src/global-settings.ts#boundarycircle

To determine the location of a point on the ideal unit sphere in the Default Screen Plane, we first scale its position vector by the default radius, and then orthographically project by simply dropping the $z$ coordinate. The sign of the $z$ coordinate indicates if the point is rendered in a style that indicates that it is on the back of the sphere or the front. This process is used repeatedly to draw one-dimensional geometric objects. In general, the rendering follows this outline:

1. Create a transformation matrix (<span class="class">Matrix4</span>) that maps the object of the correct size in a standard position (say centered at the North Pole) to the current view of the object on the unit ideal sphere.
2. Transform a sampling of points on the object in standard position to the current view.
3. Using the steps above, transform the current view points to the Default Screen Plane, keeping track of if they should be rendered in a style for the front or back.
4. Group the points that should be rendered on the front of the sphere into a front path and similarity for the back.
5. Render the front and back paths to the sphere.

In general the rendering process is more complex than this. For example, consider the case of a segment that is longer than $\pi$. It may start on the front, continue on the back for a length of $pi$ and then reappear on the front again. In this case, the set of points that should be rendered to the front (or back) comes in two discrete paths that must be rendered separately. In general, we have tried to avoid creating or deleting any of the vectors that make up an objects so that the number of points used to display an object is constant and vectors can go from being in a front path to a back path to ensure an equitable distribution of vectors tracing out the object.

## Zooming and Panning

Zooming and panning are accomplished using a CSS (affine) transform applied to the SVG object that the renderer produces. Once an object has been [rendered on the Default Screen Plane](/design/#rendering-objects), the CSS transform displays it in the Viewport (see the illustration in the [Rendering Objects](/design/#rendering-objects) section) using a Zoom Magnification Factor and a Zoom Translation Vector. (Note: in the case that Zoom Magnification Factor is 1 and the Zoom Translation Vector is $\langle 0, 0 \rangle$, the Viewport is the same as the Default Screen Plane.) There are two ways that the user can zoom and pan. One is by using a track pad or mouse wheel (these trigger the <span class="method">handleMouseWheelEvent</span> method in the <span class="file">SphereFrame.vue</span> file) or with the [Zooming and Panning Tools](/tools/display.html#zoom-pan-and-standard-view) (these events trigger an <span class="class">EventBus</span> event, which allows non-Vue components to communicate with vue components).

<<< @/src/eventHandlers/PanZoomHandler.ts#eventBus

In both cases the new Zoom Magnification Factor and Translation Vector are written to the [Store](/design/#store) and the <span class="method">updateView()</span> method in the <span class="file">SphereFrame.vue</span> file is executed.

@[code lang=ts highlight={9} transcludeWith=:::::](@/src/components/SphereFrame.vue)

<!-- <<< @/src/components/SphereFrame.vue#updateView -->

This change in the CSS affine transformation (which is alway just a scaling and a translation -- never a shear) is communicate from Vue Components to non-Vue components via this chain

resizePlottables(e: any) in Easel.vue calls adjustSizeForZoom on all plottable (gotten from Store)

<span class="method">resizePlottables(e: any)</span> method in the <span class="file">Easel.vue</span> file

@[code lang=ts highlight={9} transcludeWith=:::](@/src/views/Easel.vue)

constructor in Easel.vue contains

EventBus.listen("magnification-updated", this.resizePlottables);

SphereFrame.vue in the onCanvasResize(size: number) method contains

EventBus.fire("magnification-updated", {
factor: ratio
});

## Data Structure

The geometric objects in any arrangement are associated to an abstract data structure. The data structure is a directed acyclic graph (DAG). The vertices of the graph are the geometric objects and the arrows of the graph point from one object to another, if the location of the second object depends on the location of the first object. For example, suppose the user creates the following geometric arrangement:

- Four points, $P_1, P_2, P_3, P_4$, on the sphere.
- A circle, $C_1$, with center point $P_1$ and edge point $P_2$.
- A circle, $C_2$, with center point $P_3$ and edge point $P_4$.
- A line segment, $S_1$, from point $P_1$ to new point $P_5$ that is constrained to be on $C_2$.
- One of the intersection points, $P_6$, of $C_1$ and $C_2$.

As the location of first four points created are not constrained by any other geometric objects (except the surface of the sphere, of course), the vertices in the DAG corresponding to these points have no incoming arrows and are called **free points**. Point $P_5$, and any point that is constrained to be located on any one-dimensional object, is also considered to free. Any object that is free or only depends on free points is considered to be a **free object**. Free objects are individually movable with the [Move Tool](/tools/display.html#move).

To determine the rest of the DAG, consider what changes as we move these points. If the user moves $P_1$ then $C_1$ also moves, so there is an arrow in the DAG from the vertex corresponding to $P_1$ to the vertex corresponding to $C_1$. Similarly segment $S_1$ also moves so there is an arrow between the vertices corresponding to those objects. Continuing in this way we obtain the following DAG where the round green circles correspond to free objects (i.e. individually moveable with the [Move Tool](/tools/display.html#move)) and the red rectangles correspond to fixed objects (i.e. unmovable with the [Move Tool](/tools/display.html#move)):

<TikZPicture latex="directed_graph.tex"></TikZPicture>

The DAG associated to any geometric arrangement is used to determine which objects need to be refreshed when other objects change their location. For example, if point $P_1$ is moved, then only those objects that depend on $P_1$ (i.e. all descendents $C_1$, $P_6$, and $S_1$) need to be refreshed.

Notice that this DAG depends on the location of the objects. So for example, if the user moves the points in such a way that the circles that depend on them do not intersect, then the vertex corresponding to $P_6$ doesn't exist in the arrangement and so its corresponding vertex is no longer in the DAG. (Note that any object that is a descendent of an object that doesn't exist also doesn't exist.)

The arrows in the the DAG are programmatically declared and organized using the <span class="variable">parents</span> and <span class="variable">kids</span> array found in the <span class="class">SENodule</span> class. For example, the <span class="variable">parents</span> array of $P_6$ would contain pointers to circles $C_1$ and $C_2$ and its <span class="variable">kids</span> array would be empty. The only pointer in the both $C_1$ and $C_2$ <span class="variable">kids</span> array would be one to $P_6$. See the discussion in the [Models Directory](/design/#models-directory) for more information about how this structure is used and handled programmatically.

<!-- [Note that all directed acyclic graph can be layered.](https://link.springer.com/content/pdf/10.1007/3-540-45848-4_2.pdf) -->

## User Interface (Vue Components)

## [Event Handlers](./handlers/)

## Commands

## Languages

## Store

## Views

## Visitors

<!-- Uncomment out the two lines below and the script container in config.js to draw a circle.
Reload/Refresh the page twice! -->
<!-- ::: script
::: -->
