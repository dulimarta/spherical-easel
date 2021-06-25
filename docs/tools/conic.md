---
title: Conic Tools
lang: en-US
---

# Conic Tools

These tools create spherical conics by selecting existing objects or creating new points.

::: tool-title

## Ellipse

:::
::: tool-description

Create a ellipse.

::: tool-details

- Click to declare two points (these might be new free points or ones that snap to an existing point, object or intersection) the foci of the ellipse. Then click to decare a point (this might be new free point or one that snaps to an existing point, object or intersection) on the ellipse.
- Given two non-antipodal points (called foci, $F_1$ and $F_2$) and a point $P$. If we let $C = d(F_1,P) +d(F_1,P)$, a ellipse containing the point $P$ with foci $F_1$ and $F_2$ is the collection of points $Q$ so that $C = d(F_1,Q)+ d(F_1,Q)$. (Note that $d(A,B)$ is the [distance](/tools/measurement.html#distance) between points $A$ and $B$).
- The [Midpoint Tool](/tools/construction.html#midpoint) can be used to create the center of the ellipse which is the midpoint of the two foci.
- When an ellipse is created, a row describing some of its properties will appear in the Conics Section of the [Objects Tab](/userguide/#objects-tab).
- If this tool is activated with three points selected, the above action is performed automatically where the first two points are the foci of the ellipse and the third is the point on the ellipse.
  :::
  ::: tool-title

## Parabola

:::
::: tool-description
Create a parabola.
::: tool-details

- Click to declare a point (this might be a new free point or one that snaps to an existing point, object or intersection) a focus of the parabola and select a line or line segment object to declare the directrix of the parabola.
- Given a line and a point, a parabola is the set of points that are equidistant from the point and the line.
- Parabolas are a special type of ellipse (ones where the sum of the distance to the two foci is $\frac{\pi}{2}$) so the [Midpoint Tool](/tools/construction.html#midpoint) can be used to create the center of the parabola.
- When a parabola is created, a row describing some of its properties will appear in the Conics Section of the [Objects Tab](/userguide/#objects-tab).
- If this tool is activated with a line or line segment and point selected, the above action is performed automatically.
  :::
  ::: tool-title

## Hyperbola

:::
::: tool-description
Create a hyperbola.
::: tool-details

- Click to declare two points (these might be new free points or ones that snap to an existing point, object or intersection) the foci of the hyperbola. Then click to decare a point (this might be new free point or one that snaps to an existing point, object or intersection) on the hyperbola.
- The order in which you declare the foci matters because of the minus sign in the definition of a hyperbola. Given two non-antipodal points (called foci, $F_1$ and $F_2$) and a point $P$. If we let $C = d(F_1,P) - d(F_1,P)$, a hyperbola containing the point $P$ with foci $F_1$ and $F_2$ is the collection of points $Q$ so that $C = d(F_1,Q) - d(F_1,Q)$. (Note that $d(A,B) is the [distance](/tools/measurement.html#distance) between points $A$ and $B\$).
- Parabolas are a special type of ellipse (ones where the sum of the distance to the two foci is bigger than $\pi$) so the [Midpoint Tool](/tools/construction.html#midpoint) can be used to create the center of the hyperbola.
- When a hyperbola is created, a row describing some of its properties will appear in the Conics Section of the [Objects Tab](/userguide/#objects-tab).
- If this tool is activated with three points selected, the above action is performed automatically where the first two points are the foci of the hyperbola (in that order) and the third is the point on the hyperbola.
  :::
