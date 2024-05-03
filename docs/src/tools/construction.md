---
title: Construction Tools
lang: en-US
---

# Construction Tools

Each of the following tools constructs a geometric object by selecting existing objects or creating a collection of points.

::: tool-title

## Midpoint <icon-base notInline iconName="midpoint"> </icon-base>

:::

::: tool-description

Creates the midpoint of a line segment or the shortest length between two points or the center of a conic.

::: tool-details

- If a line segment is selected the unique midpoint is created.

- When a midpoint is created, a row describing some of its properties will appear in the Points Section of the [Objects Tab](/userguide/#objects-tab) <icon-base  iconName="objectsTab"> </icon-base>.
- If this tool is activated with a line segment the above action is performed automatically.

:::

::: tool-title

## Angle Bisector <icon-base notInline iconName="angleBisector"> </icon-base>

:::

::: tool-description
Creates the angle bisector of a measured angle.

::: tool-details

- If a measured angle is selected then the unique angle bisecting line is created.
- Note: You must _first_ measure an angle in order to bisect it.
- When an angle bisector is created, a row describing some of its properties will appear in the Lines Section of the [Objects Tab](/userguide/#objects-tab) <icon-base  iconName="objectsTab"> </icon-base>.
- If this tool is activated with a pair of line segments (with an endpoint in common) or three points selected the above action is performed automatically.

::: details Geometry Tip: Angles are tricky!
When two line segments with a common endpoint form an angle (a geometric object) there are two possible angle measures associated with the angle (one is bigger than or equal to $\pi$!). However in this case both angle measures are bisected by a common line.

When two lines intersect, in a neighborhood of one of the intersection points, four angles are formed. There are two pair of vertical angles, each with a common measurement, and each with its own bisector.

:::

::: tool-title

## Perpendicular Bisector

:::

::: tool-description
Creates the perpendicular bisector of a line segment.

::: tool-details

- Select a line segment and the line that is perpendicular to the line segment and through the midpoint of the line segment is created.
- When a perpendicular bisector is created, a row describing some of its properties will appear in the Lines Section of the [Objects Tab](/userguide/#objects-tab) <icon-base  iconName="objectsTab"> </icon-base>.
- If this tool is activated with a line segment selected the above action is performed automatically.

:::

::: tool-title

## Antipodal Point <icon-base notInline iconName="antipodalPoint"> </icon-base>

:::

::: tool-description
Creates the antipodal point of a point.

::: tool-details

- Select a point and the point that is $\pi$ away from the point is created.
- When an antipodal point is created, a row describing some of its properties will appear in the Points Section of the [Objects Tab](/userguide/#objects-tab) <icon-base  iconName="objectsTab"> </icon-base>.
- If this tool is activated with a point selected the above action is performed automatically.
  :::

::: tool-title

## Polar <icon-base notInline iconName="polar"> </icon-base>

:::

::: tool-description
Creates the poles of a line or line segment or the polar line of a point.

::: tool-details

- Clicking on a line or line segment will create the two points (the poles or polar points) that are $\frac{\pi}{2}$ away from all points on the line or line segment.
- Clicking at an empty location (or near a non-straight one- or two-dimensional object) will create a new point (or a point on a non-straight one- or two-dimensional object) and the line (the polar line) whose points are all $\frac{\pi}{2}$ away from the created point.
- Clicking on an existing point will create the polar line to that point.
- When polar objects are created row(s) describing the properties of them will appear in the Points Section of the [Objects Tab](/userguide/#objects-tab) <icon-base  iconName="objectsTab"> </icon-base>.
- If this tool is activated with a point, line segment or line selected the above action is performed automatically.

:::

::: tool-title

## Tangent <icon-base notInline iconName="tangent"> </icon-base>

:::

::: tool-description
Creates the tangent lines to a one-dimensional object (excluding lines and line segments) through a point.

::: tool-details

- Select a non-line one-dimensional object (including conics and user-defined curves) and a point (either on the one-dimensional object or not) and all the lines that are tangent to the selected one-dimensional object and through the selected point are created.
- When an tangent line is created, a row describing some of its properties will appear in the Lines Section of the [Objects Tab](/userguide/#objects-tab) <icon-base  iconName="objectsTab"> </icon-base>.
- If this tool is activated with a non-line one-dimensional object and a point selected the above action is performed automatically.

:::

::: tool-title

## Perpendicular <icon-base notInline iconName="perpendicular"> </icon-base>

:::

::: tool-description

Creates the perpendicular(s) to a one-dimensional object through a point.

::: tool-details

- Select a one-dimensional object and a point (either on the one-dimensional object or not) and the line(s) through the point and perpendicular to the one-dimensional object are created.
- Ellipse and possibly user-defined curves can have multiple lines perpendicular to them and through a given point.
- When a perpendicular line(s) is created, a row(s) describing some of its properties will appear in the Lines Section of the [Objects Tab](/userguide/#objects-tab) <icon-base  iconName="objectsTab"> </icon-base>.
- If this tool is activated with a one-dimensional object and a point selected the above action is performed automatically.

:::

::: tool-title

## Attach/Detach Point

:::

::: tool-description

Attach or detach a point from an object.

::: tool-details

- Select an existing point that is attached (ie. "on" or "glued to") a one-dimensional object and it becomes detached from that object.
- Select an existing point that is free (i.e. at the top layer of the dependency structure - for more information see the [Move Tool](/tools/display.html#move)) and then a one-dimensional object and it becomes attached to that object.
- If this tool is activated with any objects selected, they are all unselected and ignored.
  :::

::: tool-title

## Intersection <icon-base notInline iconName="intersect"> </icon-base>

:::

::: tool-description

Create the intersection point(s) between two one-dimensional objects.

::: tool-details

- Select two one-dimensional objects and all intersection points between them are created.
- This tool should not be needed because Spherical Easel always assumes the if the user attempts to create a point _**near**_ an intersection of two one-dimensional objects, the user would like the point to be an intersection of the objects.
- When an intersection point(s) is created, a row(s) describing some of its properties will appear in the Points Section of the [Objects Tab](/userguide/#objects-tab) <icon-base  iconName="objectsTab"> </icon-base>.
- If this tool is activated with two one-dimensional objects selected the above action is performed automatically.
  :::

::: tool-title

## Point On Object <icon-base notInline iconName="pointOnObject"> </icon-base>

:::

::: tool-description

Create a point that is constrained to be on a one- or two- dimensional object.

::: tool-details

- Click at a location near a one- or two-dimensional object and a point is created that is constrained to be on that object.
- This tool should not be needed because Spherical Easel always assumes that if the user attempts to create a point _**near**_ a one- or two-dimensional object, it is assumed that the user wanted the point created _**on**_ the object (i.e. in such a way the that point is constrained to be on the object).
- A point is constrained to be on a one- or two-dimensional object, or "glued" to it, if you can move the point but it never leaves the object onto which it was glued.
- You can Attach/Dettach a point from an object using the [Attach/Detach Point Tool](/tools/construction.html#attach-detach-point)
- When a point on object is created, a row describing some of its properties will appear in the Points Section of the [Objects Tab](/userguide/#objects-tab) <icon-base  iconName="objectsTab"> </icon-base>.
- When this tool is activated all previously selected objects are unselected and ignored.

:::
