---
title: Basic Tools
lang: en-US
---

# Basic Tools

These are the basic tools for constructing arrangements.

::: tool-title

## Point

:::
::: tool-description
Create a point.
::: tool-details

- Mouse release at a location to create a point.
- When a point is created, a row describing some of its properties will appear in the Points section of [Objects Tab](/userguide/#objects-tab).
- If this tool is activated with any objects selected, they are all unselected and ignored.

::: tip Snap To Point

When creating points with this tool, or any other tool that creates an object depending on points, Spherical Easel always assumes that if the user attempts to create

- a point _**near**_ a one-dimensional object, it is assumed that the user wanted the point created _**on**_ the object (i.e. in such a way the that point is constrained to be on the object). That is, the [Point On Object Tool](/tools/construction.html#point-on-object) was used.
- a point _**near**_ an intersection of two one-dimensional objects, the user would like the point to be an intersection of the objects. That is, the [Intersection Tool](/tools/construction.html#intersection) was used.
- a point _**near**_ an existing point, the user would like to use the nearby point and not create a new one.

These three features are a "snap to point" assumption that Spherical Easel always makes.

:::

::: tool-title

## Line

:::
::: tool-description
Create a line.

::: tool-details

- Mouse press to declare one point on the line (this might be new free point or one that snaps to an existing point, object or intersection), then drag to a second location, and mouse release to declare a second point on the line (this might be new free point or one that snaps to an existing point, object or intersection).
- The two points and a vector normal to the location of both of them (not displayed, but dynamically created as the user drags, for use in the case that the two points are antipodal or almost antipodal) determine a unique line.
- When a line is created, a row describing some of its properties will appear in the Lines section of the [Objects Tab](/userguide/#objects-tab).
- If this tool is activated with two points selected the above action is performed automatically creating a line and an arbitrary normal vector in the case that the points are antipodal.
  :::

::: tool-title

## Line Segment

:::
::: tool-description
Create a line segment.

::: tool-details

- Mouse press to declare a start point on the line segment (this might be new free point or one that snaps to an existing point, object or intersection), then drag to a second location, and mouse release to declare an endpoint of the line segment (this might be new free point or one that snaps to an existing point, object or intersection).
- The two points and their midpoint (not displayed, but dynamically created as the user drags) determine a unique line segment.
- Pressing the <kyb>Ctrl</kyb> key while dragging will force the line segment created to be longer than $\pi$.
- When a line segment is created, a row describing some of its properties will appear in the Line Section of the [Objects Tab](/userguide/#objects-tab).
- If this tool is activated with two points selected the above action is performed automatically creating a line segment with length less than $\pi$ and an arbitrary normal vector in the case that the points are antipodal.

::: tip

It is possible to draw a line segment of length longer than $\pi$. If the user creates a line segment by dragging to the antipode of the start point and then pushes and holds the <kbd>Ctrl</kbd> key (and the <kbd>Shift</kbd> key if the antipode is on the back of the sphere), the segment will be extensible through and past the antipode of the start. In addition, if after releasing the mouse, the line segment connecting two points goes the wrong way around the sphere, you can use the [Toggle Line Segment Tool](/tools/basic.html#toggle-line-segment) to change it.

:::

::: tool-title

## Toggle Line Segment

:::

::: tool-description

Toggle a line segment.

::: tool-details

- Mouse releasing on a line segment, toggles the line segment between having [length](/tools/measurement.html#length) less than or equal to $\pi$ to greater than or equal to $\pi$.
- If this tool is activated with a line segment selected the above action is performed automatically.

:::

::: tool-title

## Circle

:::

::: tool-description
Create a circle.
::: tool-details

- Mouse press to declare the center point of the circle (this might be new free point or one that snaps to an existing point, object or intersection), then drag to a second location, and mouse release to declare a point on the circle (this might be new free point or one that snaps to an existing point, object or intersection).
- When a circle is created, a row describing some of its properties will appear in the Circle Section of the [Objects Tab](/userguide/#objects-tab).
- The first point is the center of the circle and the second point is a point on the circle. These two points determine a unique circle.
- If this tool is activated with two points selected the above action is performed automatically where the first point is the center and the second is the point on the circle.

:::

::: tool-title

## Polygon

:::

::: tool-description

Create a polygon. [This is a challenging tool to create because the shading will have to be done right! Imagine a polygon that is almost half the sphere -- the whole top or bottom half would have to be shaded! Perhaps it is not worth it...]

::: tool-details

- There are two ways to create a polygon:
  - Select a cycle of line segments. A cycle of line segments is a ordered list of line segments $[s_1, s_2, s_3, \ldots , s_n]$ ($n \geq 3$), where for all indices $i$, the ending point of segment $s_i$ is the starting point of segment $s_{i+1}$ and the indices are counted modulo $n$.
  - Create the vertices of the polygon, by clicking at a series of $n \leq 3$ locations. Temporary points (which might be new free points, existing points, intersection points, or points on objects) are created at each click location and temporary line segments are created in order between the points as they are created (also assuming the line segment has length less than $\pi$). To complete the polygon you must click on the first point that was created. Upon completion the temporary points and line segments are added to the arrangement.
- The inside of the polygon is alway the region that is to the left of a person walking along the edges on the outside of the sphere.
- When a polygon is created, a row describing some of its properties will appear in the Polygon Section of the [Objects Tab](/userguide/#objects-tab).
- If this tool is activated with a cycle of line segments, or a collection of points, selected the above action is performed automatically.
- This is hard because the polygon is not necessarily convex and may be crossed! Perhaps restrict to convex polygons or only promise the user that the tool will work as described for convex polygons
  :::

::: tool-title

## Text

:::
::: tool-description

Create text.

::: tool-details

- Mouse release at a location to mark the location (inside or outside of the boundary circle) to place text. A popup asks for the actual text.
- Text can include Measurement Token (which will be replaced with actual value when rendered) and [$\LaTeX$](https://en.wikipedia.org/wiki/LaTeX).
- To edit a text object [select](/tools/edit.html#selection) it and use the Style Panel.
- Text objects can be moved with the [Move Tool](/tools/display.html#move)/
- When a text object is created, a row describing some of its properties will appear in the Text Section of the [Objects Tab](/userguide/#objects-tab).
- If this tool is activated with any objects selected, they are all unselected and ignored.
  :::
