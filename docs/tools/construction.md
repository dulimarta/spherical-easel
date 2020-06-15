---
title: Construction Tools
lang: en-US
---

# Construction Tools

Each of the following tools constructs a geometric object by selecting existing objects or creating a collection of points.

::: tool-title

## Midpoint

:::

::: tool-description

Creates the midpoint of a line segment or the shortest length between two points or the center of a conic.

::: tool-details

- If a line segment is selected the unique midpoint is created.
- If two points are selected (or created by clicking at two locations) then there are two cases:
  - If the points are antipodal then the midpoint doesn't exist and nothing is created. However, the midpoint is still created and if later the points are moved to a non-antipodal locations the midpoint will appear.
  - If the points are not antipodal it is assumed that the line segment connecting the two points (not displayed or created) has length less than $\pi$ and the midpoint of that line segment is created.
- Selecting a conic (a circle created with the [Three Point Circle Tool](/tools/advanced.html#three-point-circle) or a [conic](/tools/conic.html)) creates the center of the conic.
- When a midpoint is created, a row describing some of its properties will appear in the Points Section of the [Objects Tab](/userguide/#objects-tab).
- If this tool is activated with a line segment, two points, or a conic selected, the above action is performed automatically.

:::

::: tool-title

## Angle Bisector

:::

::: tool-description
Creates the angle bisector of a pair of line segments with an endpoint in common, a pair of lines, or three points.

::: tool-details

- There are three different ways to select or create an angle to bisect:
  - If a pair of lines is selected, then an angle is bisector is created depending on the order in which the lines were selected and the right-hand rule. If you place your right hand at one of the intersection points of the lines with your thumb pointing away from the center of the sphere and your fingers in the direction of the first line then as you curl your fingers toward the second line, the region swept out is the angle that is bisected.
  - If a pair of line segments with a common endpoint is selected, then the angle bisector is created at the common endpoint.
  - If a triple of points is selected (or created by clicking at three location) then the order in which the points were selected matters. The angle bisector is created at the second selected point. It is created using the right-hand rule as above assuming that there is a line segment (not necessarily shown or created) from the first to the second point and a line segment (not necessarily shown or created) from the second to the third point each of which has length less than $\pi$.
- When an angle bisector is created, a row describing some of its properties will appear in the Lines Section of the [Objects Tab](/userguide/#objects-tab).
- If this tool is activated with a pair of line segments (with an endpoint in common) or three points selected the above action is performed automatically.

::: details Geometry Tip: Angles are tricky!
When two line segments with a common endpoint form an angle (a geometric object) there are two possible angle measures associated with the angle (one is bigger than or equal to $\pi$!). However in this case both angle measures are bisected by a common line.

When two lines intersect, in a neighborhood of one of the intersection points, four angles are forms. There are two pair of vertical angles, each with a common measurement, and each with its own bisector.

:::

::: tool-title

## Perpendicular Bisector

:::

::: tool-description
Creates the perpendicular bisector of a line segment.

::: tool-details

- Select a line segment and the line that is perpendicular to the line segment and through the midpoint of the line segment is created.
- When a perpendicular bisector is created, a row describing some of its properties will appear in the Lines Section of the [Objects Tab](/userguide/#objects-tab).
- If this tool is activated with a line segment selected the above action is performed automatically.

:::

::: tool-title

## Antipodal Point

:::

::: tool-description
Creates the antipodal point of a point.

::: tool-details

- Select a point and the point that is $\pi$ away from the point is created.
- When an antipodal point is created, a row describing some of its properties will appear in the Points Section of the [Objects Tab](/userguide/#objects-tab).
- If this tool is activated with a point selected the above action is performed automatically.
  :::

::: tool-title

## Polar Points

:::

::: tool-description
Creates the poles of a line or line segment.

::: tool-details

- There are two ways to create polar points:

  - Selecting a line or line segment will create the two points that are $\frac{\pi}{2}$ away from all points on the line or line segment.
  - If two points are selected (or created by clicking at two locations) then only one polar point is created. Which polar point created depends on the order of the the points and the right-hand rule. If you put your right hand in the center of the sphere and your fingers in the direction of the first point and curl them toward the second point, your thumb points at the polar point that is created. If the points are antipodal (or near antipodal) then the polar point doesn't exist and nothing is created. However, the polar point is still created and if later the points are moved to a non-antipodal locations the polar point will appear.

* When two polar points are created, two rows, each describing the properties of one of the points, will appear in the Points Section of the [Objects Tab](/userguide/#objects-tab).
* If this tool is activated with a line segment or line selected the above action is performed automatically.

:::

::: tool-title

## Tangent

:::

::: tool-description
Creates the tangent lines to a one-dimensional object (excluding lines and line segments) through a point.

::: tool-details

- Select a non-line one-dimensional object (including conics and user-defined curves) and a point (either on the one-dimensional object or not) and all the lines that are tangent to the selected one-dimensional object and through the selected point are created.
- When an tangent line is created, a row describing some of its properties will appear in the Lines Section of the [Objects Tab](/userguide/#objects-tab).
- If this tool is activated with a non-line one-dimensional object and a point selected the above action is performed automatically.

:::

::: tool-title

## Perpendicular

:::

::: tool-description

Creates the perpendicular(s) to a one-dimensional object through a point.

::: tool-details

- Select a one-dimensional object and a point (either on the one-dimensional object or not) and the line(s) through the point and perpendicular to the one-dimensional object are created.
- Ellipse and possibly user-defined curves can have multiple lines perpendicular to them and through a given point.
- When a perpendicular line(s) is created, a row(s) describing some of its properties will appear in the Lines Section of the [Objects Tab](/userguide/#objects-tab).
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

## Intersection

:::

::: tool-description

Create the intersection point(s) between two one-dimensional objects.

::: tool-details

- Select two one-dimensional objects and all intersection points between them are created.
- This tool should not be needed because Spherical Easel always assumes the if the user attempts to create a point _**near**_ an intersection of two one-dimensional objects, the user would like the point to be an intersection of the objects.
- When an intersection point(s) is created, a row(s) describing some of its properties will appear in the Points Section of the [Objects Tab](/userguide/#objects-tab).
- If this tool is activated with two one-dimensional objects selected the above action is performed automatically.
  :::

::: tool-title

## Point On Object

:::

::: tool-description

Create a point that is constrained to be on a one-dimensional object.

::: tool-details

- Click at a location near a one-dimensional object and a point is created that is constrained to be on that object.
- This tool should not be needed because Spherical Easel always assumes that if the user attempts to create a point _**near**_ a one-dimensional object, it is assumed that the user wanted the point created _**on**_ the object (i.e. in such a way the that point is constrained to be on the object).
- A point is constrained to be on a one-dimensional object, or "glued" to it, if you can move the point but it never leaves the object onto which it was glued.
- You can Attach/Dettach a point from an object using the [Attach/Detach Point Tool](/tools/construction.html#attach-detach-point)
- ?A point that is constrained to be on a polygon is merely constrained to be in the convex hull of the vertices of the polygon?
- When a point on object is created, a row describing some of its properties will appear in the Points Section of the [Objects Tab](/userguide/#objects-tab).
- When this tool is activated all previously selected objects are unselected and ignored.

:::
