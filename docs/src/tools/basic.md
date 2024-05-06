---
title: Basic Tools
lang: en-US
---

# Basic Tools

These are the basic tools for constructing arrangements.

::: tool-title

## Point <IconBase notInLine icon-name="point" />

:::
::: tool-description
Create a point.
::: tool-details

- Mouse press at a location to create a point.
- When a point is created, a row describing some of its properties will appear in the Points section of [Objects Tab](/userguide/#objects-tab) <icon-base  iconName="objectsTab"> </icon-base> <IconBase  icon-name="objectsTab" />.
- Creating a point in a [Polygon](/tools/measurement#polygon) <IconBase  icon-name="measurePolygon" /> or [Triangle](/tools/measurement#triangle) <IconBase  icon-name="measureTriangle" /> ,means that the point is constrained to be inside the polygon or triangle.
- If this tool is activated with any objects selected, they are all unselected and ignored.

:::

::: tip Snap To Point

When creating points with this tool, or any other tool that creates an object depending on points, Spherical Easel always assumes that if the user attempts to create a point _**near**_

- a one-dimensional object, it is assumed that the user wanted the point created _**on**_ the object (i.e. in such a way the that point is constrained to be on the object). That is, the [Point On Object Tool](/tools/construction#point-on-object) <IconBase  icon-name="pointOnObject" /> was used.
- an intersection of two one-dimensional objects, the user would like the point to be an intersection of the objects. That is, the [Intersection Tool](/tools/construction#intersection) <IconBase  icon-name="intersect" /> was used.
- an existing point, the user would like to use the nearby point and not create a new one.

These three features are a "snap to point" assumption that Spherical Easel always makes.

:::

::: tool-title

## Line <icon-base notInLine iconName="line"> </icon-base>

:::
::: tool-description
Create a line.

::: tool-details

- Mouse press to declare one point on the line (this might create a new free point or one that snaps to an existing point, object or intersection),
- Mouse release to declare a second point on the line (this might create a new free point or one that snaps to an existing point, object or intersection).
- The two points and a vector normal to the location of both of them (not displayed, but dynamically created as the user drags, for use in the case that the two points are antipodal or almost antipodal) determine a unique line.
- When a line is created, a row describing some of its properties will appear in the Lines section of the [Objects Tab](/userguide/#objects-tab) <icon-base  iconName="objectsTab"> </icon-base> <icon-base  iconName="objectsTab"> </icon-base>.
- If this tool is activated with two points selected a line is automatically created and, in the case that the points are antipodal, a normal vector equal to the north pole of the displayed sphere.
  :::

::: tool-title

## Line Segment <icon-base notInLine iconName="segment"> </icon-base>

:::
::: tool-description
Create a line segment.

::: tool-details

- Mouse press to declare a start point on the line segment (this might be new free point or one that snaps to an existing point, object or intersection), then drag to a second location, and mouse release to declare an endpoint of the line segment (this might be new free point or one that snaps to an existing point, object or intersection).
- The two points and their midpoint (not displayed, but dynamically created as the user drags) determine a unique line segment.
- Pressing the <KeyShortcuts macCtrl pcCtrl  /> key while dragging will force the line segment created to be longer than $\pi$.
- When a line segment is created, a row describing some of its properties will appear in the Line Section of the [Objects Tab](/userguide/#objects-tab) <icon-base  iconName="objectsTab"> </icon-base>.
- If this tool is activated with two points selected the above action is performed automatically creating a line segment with length less than $\pi$ and an arbitrary normal vector in the case that the points are antipodal.

::: tip

It is possible to draw a line segment of length longer than $\pi$. If the user creates a line segment by dragging to the antipode of the start point and then pushes and holds the <kbd>Ctrl</kbd> key (and the <kbd>Shift</kbd> key if the antipode is on the back of the sphere), the segment will be extensible through and past the antipode of the start. In addition, if after releasing the mouse, the line segment connecting two points goes the wrong way around the sphere, you can use the [Toggle Line Segment Tool](/tools/basic#toggle-line-segment) to change it.

:::

::: tool-title

## Toggle Line Segment

:::

::: tool-description

Toggle a line segment.

::: tool-details

- Mouse releasing on a line segment, toggles the line segment between having [length](/tools/measurement#length) less than or equal to $\pi$ to greater than or equal to $\pi$.
- If this tool is activated with a line segment selected the above action is performed automatically.

:::

::: tool-title

## Circle <icon-base notInLine iconName="circle"> </icon-base>

:::

::: tool-description
Create a circle.
::: tool-details

- Mouse press to declare the center point of the circle (this might be new free point or one that snaps to an existing point, object or intersection), then drag to a second location, and mouse release to declare a point on the circle (this might be new free point or one that snaps to an existing point, object or intersection).
- When a circle is created, a row describing some of its properties will appear in the Circle Section of the [Objects Tab](/userguide/#objects-tab) <icon-base  iconName="objectsTab"> </icon-base>.
- The first point is the center of the circle and the second point is a point on the circle. These two points determine a unique circle.
- If this tool is activated with two points selected the above action is performed automatically where the first point is the center and the second is the point on the circle.

:::

::: tool-title

## Text

:::
::: tool-description

Create text.

::: tool-details

- Mouse release at a location to mark the location (inside or outside of the boundary circle) to place text. A popup asks for the actual text.
- Text can include Measurement Token (which will be replaced with actual value when rendered) and [$\LaTeX$](https://en.wikipedia.org/wiki/LaTeX).
- To edit a text object [select](/tools/edit#selection) it and use the Style Panel.
- Text objects can be moved with the [Move Tool](/tools/display#move)/
- When a text object is created, a row describing some of its properties will appear in the Text Section of the [Objects Tab](/userguide/#objects-tab) <icon-base  iconName="objectsTab"> </icon-base>.
- If this tool is activated with any objects selected, they are all unselected and ignored.
  :::
