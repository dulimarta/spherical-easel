---
title: Measurement Tools
lang: en-US
---

# Measurement Tools

Each of the following tools measures some aspect of an arrangement or creates a measurement object.

::: tool-title

## Length

:::
::: tool-description
Measure the length of a line segment.
::: tool-details

- Select a line segment to measure its length.
- The measured length can be larger than $\pi$, but is always less than $2\pi$.
- When a length measurement is created, a row describing some of its properties (including its value) will appear in the Measurement Section of the [Objects Tab](/userguide/#objects-tab).
- If this tool is activated with a line segment selected the above action is performed automatically.

::: tip
To adjust the number of decimal places displayed in the Measurement Section of the [Objects Tab](/userguide/#objects-tab), open the Global Settings in the [Title Bar](userguide/#top-region-title-bar)
:::

::: tool-title

## Distance

:::
::: tool-description
Measure the distance between two points.
::: tool-details

- Select two points to measure the distance between them.
- The measured distance can never be larger than $\pi$.
- When a distance measurement is created, a row describing some of its properties (including its value) will appear in the Measurement Section of the [Objects Tab](/userguide/#objects-tab).
- If this tool is activated with points selected, the above action is performed automatically.
  :::
  ::: tool-title

## Angle

:::
::: tool-description
Measure the angle created by two lines, two line segments with a common endpoint, or three points.
::: tool-details

- There are three different ways to select or create an angle to measure:
  - If a pair of lines (or line segments with a common endpoint) is selected, then which angle is measured depends on the order in which the lines (or line segments) were selected and the right-hand rule. If you place your right hand at one of the intersection points of the lines (or the common endpoint of the line segments) with your thumb pointing away from the center of the sphere and your fingers in the direction of the first line (or line segment) then as you curl your fingers toward the second line (or line segment), the region swept out is the angle that is measured.
  - If a triple of points is selected (or created) then the order in which the points were selected matters. The angle measure is determined using the right hand rule as above assuming that there is a line segment (not necessarily shown or created) from the first to the second point and a line segment (not necessarily shown or created) from the second to the third point each of which has length less than $\pi$.
- An angle marker is displayed indicating the angle that was measured.
- When an angle measurement is created, a row describing some of its properties (including its value) will appear in the Measurement Section of the [Objects Tab](/userguide/#objects-tab).
- If this tool is activated with two lines or two line segments with a common endpoint or a triple of points selected, the above action is performed automatically.

::: details Geometry Tip: Angles are tricky!
When two line segments with a common endpoint form an angle (a geometric object) there are two possible angle measures associated with the angle (one is bigger than or equal to $\pi$!).

When two lines intersect, in a neighborhood of one of the intersection points, four angles are forms. There are two pair of vertical angles, each with a common measurement.

:::

::: tool-title

## Coordinates

:::
::: tool-description
Record the $x$, $y$, or $z$ coordinates of a point as a Measurement object.
::: tool-details

- Select (or create) a point to measure the distance between them.
- After a point is selected, a dialog box is prompts to check which coordinates should be recorded.
- For each coordinate selected a measurement is created and a row for each describing some of its properties (including its value) will appear in the Measurement Section of the [Objects Tab](/userguide/#objects-tab).
- When this tool is activated all previously selected objects are unselected and ignored.
- If this tool is activated with a point selected, the above action is performed automatically.
  :::

::: tool-title

## Slider

:::
::: tool-description
Creates a slider or adjust the value of an existing non-animated slider.

::: tool-details

- Mouse release at a location to create a slider there.
- After selecting a location a dialog box opens prompting the user to enter values for the lower and upper bounds of the slider, a step size, and if the slider should be animated.
- If the slider is animated, it automatically steps through the values from lower to upper by the step size. If it is not animated, the sliders value can be adjusted by clicking and dragging the control dot when this tool is active.
- The lower bound, upper bound, step size, animation options (on, loop or reflect) can be adjusted in the Style Panel.
- When a slider is created, a row describing some of its properties (including its value) will appear in the Measurement Section of the [Objects Tab](/userguide/#objects-tab).
- When this tool is activated all previously selected objects are unselected and ignored.
  :::
  ::: tool-title

## Triangle

:::
::: tool-description
Measure all aspects of a triangle
::: tool-details

- There are two ways to measure a triangle:
  - Select a cycle of three line segments. A cycle of line segments is a ordered list of line segments $[s_1,s_2,s_3]$, where for all indices, the ending point of segment $s_i$ is the starting point of segment $s_{i+1}$ and the indices are counted modulo 3.
  - Create the vertices of the triangle by clicking at a series of 3 locations. Temporary points (which might be existing points, intersection points, or points on objects) are created at each click location and temporary line segments are created in order between the points as they are created (also assuming the line segment has length less than $\pi$). To complete the triangle you must click on the first point that was created. Upon completion the temporary points and line segments are added to the arrangement.
- When a triangle is measured, angle markers appear at the vertices of the triangle. The order in which the cycle of line segments or points are created matters. The angles that are measured are determined in the same way that they are for the [Angle Tool](/tools/measurement.html#angle) -- using the right-hand rule and their order.
- When a triangle is measured, a row for each of the following properties will appear in the Measurement Section of the [Objects Tab](/userguide/#objects-tab).
  - The length of the three line segments.
  - The measure of the three angles in the triangle.
  - The area of the triangle.
- If this tool is activated with a cycle of line segments or a collection of three points selected, the above action is performed automatically.

:::

::: tool-title

## Polygon (too hard?)

:::

::: tool-description
Measure all aspects of a polygon
::: tool-details

- There are several ways to measure a polygon:
  - Select an existing polygon.
  - Select a cycle of line segments. A cycle of line segments is a ordered list of line segments $[s_1,s_2,s_3, \ldots, s_n]$ ($n\geq 3$), where for all indices, the ending point of segment $s_i$ is the starting point of segment $s_{i+1}$ and the indices are counted modulo $n$.
  - Create the vertices of the polygon by clicking at a series of $n \geq 3$ locations. Temporary points (which might be existing points, intersection points, or points on objects) are created at each click location and temporary line segments are created in order between the points as they are created (also assuming the line segment has length less than $\pi$). To complete the polygon you must click on the first point that was created. Upon completion the temporary points and line segments are added to the arrangement.
- When a polygon is measured, angle markers appear at the vertices of the polygon. The order in which the cycle of line segments or points are created matters. The angles that are measured are determined in the same way that they are for the [Angle Tool](/tools/measurement.html#angle) -- using the right-hand rule and their order.
- When a polygon is measured, a row for each of the following properties will appear in the Measurement Section of the [Objects Tab](/userguide/#objects-tab).
  - The length of each line segment.
  - The measure of each of the angles in the polygon.
  - The area of the polygon (This is hard because the polygon is not necessarily convex and may be crossed!).
- If this tool is activated with a cycle of line segments or a collection of points selected, the above action is performed automatically.
  :::
