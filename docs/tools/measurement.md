---
title: Measurement Tools
lang: en-US
---

# Measurement Tools

Each of the following tools measures some aspect of an arrangement or creates a measurement object.

::: tool-title

## Length <icon-base notInline iconName="segmentLength"> </icon-base>

:::
::: tool-description
Measure the length of a line segment.
::: tool-details

- Select a line segment to measure its length.
- The measured length can be larger than $\pi$, but is always less than $2\pi$.
- When a length measurement is created, a row describing some of its properties (including its value and measurement token) will appear in the [Measurement Section of the Objects List](/userguide/toolsobjectspanel.html#objects-list).
- If this tool is activated with a line segment selected the above action is performed automatically.

::: tip
To adjust the number of decimal places displayed in the[Measurement Section of the Objects List](/userguide/toolsobjectspanel.html#objects-list), open the Global Settings in the [Title Bar](/userguide/#top-region-title-bar)
:::

::: tool-title

## Distance <icon-base notInline iconName="pointDistance"> </icon-base>

:::
::: tool-description
Measure the distance between two points.
::: tool-details

- Select two points to measure the distance between them.
- The measured distance can never be larger than $\pi$.
- When a distance measurement is created, a row describing some of its properties (including its value and Measurement Token) will appear in the [Measurement Section of the Objects List](/userguide/toolsobjectspanel.html#objects-list).
- If this tool is activated with points selected, the above action is performed automatically.
  :::
  ::: tool-title

## Angle <icon-base notInline iconName="angle"> </icon-base>

:::
::: tool-description
Measure the angle created by two lines, two line segments with a common endpoint, or three points.
::: tool-details

- There are four different ways to select or create an angle to measure:
  - If a pair of lines, line segments with a common endpoint, or a line and a line segment with one endpoint on the line is selected, then which angle is measured depends on the order in which the lines or line segments were selected and the right-hand rule. If you place your right hand at the intersection points of the lines on the front of the sphere (or the common endpoint of the line segments or the endpoint of the line segment on the line) with your thumb pointing away from the center of the sphere and your fingers in the direction of the first selected line or line segment then as you curl your fingers toward the second selected line or line segment, the region swept out is the angle that is measured.
  - If a triple of points is selected (or created) then the order in which the points were selected matters. The second point selected is the vertex of the angle. The angle measure is determined using the right hand rule as above assuming that there is a line segment (not necessarily shown or created but with length less than $\pi$) from the first selected point to the second point and a line segment (not necessarily shown or created but with length less than $\pi$) from the second selected point to the third selected point.
- An angle marker is displayed indicating the angle that was measured. The vertex of the angle marker is the intersection point of the lines on the front of the sphere initially (unless the lines have common point defining them and then the common point is the vertex even if that common point is on the back side of the sphere when the angle marker is created), the common endpoint of the line segments, the endpoint of the line segment on the line, or the second point selected.
- When an angle measurement is created, a row describing some of its properties (including its value and Measurement Token) will appear in the [Measurement Section of the Objects List](/userguide/toolsobjectspanel.html#objects-list).
- If this tool is activated with any objects selected, they are all unselected and ignored.

::: details Geometry Tip: Angles are tricky!
When two line segments with a common endpoint form an angle (a geometric object) there are two possible angle measures associated with the angle (one is bigger than or equal to $\pi$!).

When two lines intersect, in a neighborhood of one of the intersection points, four angles are formed. There are two pairs of vertical angles, each with a common measurement.

:::

::: tool-title

## Coordinates <icon-base notInline iconName="coordinate"> </icon-base>

:::
::: tool-description
Record the $x$, $y$, or $z$ coordinates of a point as a Measurement object.
::: tool-details

- Select (or create) a point to measure the distance between them.
- For each coordinate a measurement is created and a row for each describing some of its properties (including its value and Measurement Token) will appear in the [Measurement Section of the Objects List](/userguide/toolsobjectspanel.html#objects-list).
- If this tool is activated with a point selected, the above action is performed automatically.
  :::

::: tool-title

## Triangle <icon-base notInline iconName="measureTriangle" />

:::
::: tool-description
Measure all aspects of a triangle.
::: tool-details

- Select a non-crossing cycle of three line segments to create and measure a triangle. A cycle of line segments is a ordered list of line segments $[s_1,s_2,s_3]$, where for all indices, the ending point of segment $s_i$ is the starting point of segment $s_{i+1}$ and the indices are counted modulo 3. A cycle is non-crossing if each end point of a segment in the cycle belongs to exactly two line segments in the cycle and any two line segments in the cycle intersect either in one point that is an endpoint of both segments or not at all.
- When a triangle is measured, angle markers appear at the vertices of the triangle, and all line segments in the triangle are measured (unless they were already measured). The order in which the cycle of line segments are created matters. The angles that are measured are determined in the same way that they are for the [Angle Tool](/tools/measurement.html#angle) -- using the right-hand rule and their order.
- When a triangle is measured, a row for each of the following properties will appear in the [Measurement Section of the Objects List](/userguide/toolsobjectspanel.html#objects-list).
  - The length of each of the three line segments.
  - The measure of each of the three angles in the triangle.
  - The area of the triangle.
- If this tool is activated with any objects selected, they are all unselected and ignored.

:::

::: tool-title

## Polygon <icon-base notInline iconName="measurePolygon" />

:::

::: tool-description
Measure all aspects of a polygon
::: tool-details

- Select a non crossing cycle of line segments to create and measure a polygon. A cycle of line segments is a ordered list of line segments $[s_1,s_2,s_3, \ldots, s_n]$ ($n\geq 3$), where for all indices, the ending point of segment $s_i$ is the starting point of segment $s_{i+1}$ and the indices are counted modulo $n$. A cycle is non-crossing if each end point of a segment in the cycle belongs to exactly two line segments in the cycle and any two line segments in the cycle intersect either in one point that is an endpoint of both segments or not at all.
- When a polygon is measured, angle markers appear at the vertices of the polygon. The order in which the cycle of line segments are created matters. The angles that are measured are determined in the same way that they are for the [Angle Tool](/tools/measurement.html#angle) -- using the right-hand rule and their order.
- When a polygon is measured, a row for each of the following properties will appear in the [Measurement Section of the Objects List](/userguide/toolsobjectspanel.html#objects-list)..
  - The length of each line segment.
  - The measure of each of the angles in the polygon.
  - The area of the polygon.
- If this tool is activated with any objects selected, they are all unselected and ignored.
  :::
