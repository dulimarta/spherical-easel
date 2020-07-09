---
title: Measured Object Tools
lang: en-US
---

# Measured Object Tools

::: tool-title

## Parametric Point

:::
::: tool-description

Create a point whose $x$, $y$, and $z$ coordinates are controlled by Measurement Objects.

::: tool-details

- Select the Parametric Point Tool and the [Advanced Tab](/userguide/stylepanel.html#advanced-tab) of the Style Panel will open. The user can then enter the $x$, $y$, and $z$ coordinates of a point. These three expressions can include Measurement Tokens. If there are no Measurement Token, the point will be at fixed set of coordinates.
- If the $z$ coordinate is blank, it is assumed that $z = \sqrt{1-x^2 - y^2}$.
- For any instances where $x^2 + y^2 >1 $ then the $x$ and $y$ coordinates are rescaled to $\frac{x}{\sqrt{x^2 + y^2}}$ and $\frac{y}{\sqrt{x^2 + y^2}}$ (and $z=0$).
- When a Parametric Point is created, a row describing some of its properties will appear in the Line Section of the [Objects Tab](/userguide/#objects-tab).
- When this tool is activated all previously selected objects are unselected and ignored.
  :::

::: tool-title

## Measured Angle Line

:::
::: tool-description

Create a line at a measured angle to a given line (or line segment) and through a point on that line.

::: tool-details

- Select a line (or line segment) and a point on that line (or line segment) and select a measurement from the Measurement Section of the [Objects Tab](/userguide/#objects-tab) to determine the angle.
- Positive measurement values are counterclockwise angles and negative are clockwise (when seen from outside of the sphere).
- When a Measured Angle Line is created, a row describing some of its properties will appear in the Line Section of the [Objects Tab](/userguide/#objects-tab).
- When this tool is activated all previously selected objects are unselected and ignored.
  :::

::: tool-title

## Measured Radius Circle

:::
::: tool-description
Create a circle with radius controlled by a Measurement Object
::: tool-details

- Select (or create) a center point and select a measurement from the Measurement Section of the [Objects Tab](/userguide/#objects-tab) to determine radius of the circle.
- The absolute value of the measurement determines the radius of the circle.
- When a Measured Radius Circle is created, a row describing some of its properties will appear in the Circle Section of the [Objects Tab](/userguide/#objects-tab).
- When this tool is activated all previously selected objects are unselected and ignored.
  :::
