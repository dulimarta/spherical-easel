---
title: Measured Object Tools
lang: en-US
---

# Measured Object Tools

Each of these tools is used to create a object based on previously created measurements.

## <ToolTitle title="Parametric Point" iconName="blank" />  {#parametric}

Create a point whose $x$, $y$, and $z$ coordinates are controlled by Measurement Objects.

::: details Future:

- Select two measurements from the [Measurement Section of the Objects List](/userguide/toolsobjectspanel#objects-list) to determine the $x$ and $y$ coordinates of a point.
- It is assumed that $z = \sqrt{1-x^2 - y^2}$ unless the user holds the <kbd>Shift</kbd> key while selecting the measurements, and then it is assumed that $z = -\sqrt{1-x^2 - y^2}$
- For any instances where $x^2 + y^2 >1$ then the $x$ and $y$ coordinates are rescaled to $\frac{x}{\sqrt{x^2 + y^2}}$ and $\frac{y}{\sqrt{x^2 + y^2}}$ (and $z=0$).
- When a Parametric Point is created, a row describing some of its properties will appear in the Line Section of the [Objects Tab](/userguide/#objects-tab) <icon-base  iconName="objectsTab"> </icon-base>.
- When this tool is activated all previously selected objects are unselected and ignored.

## <ToolTitle title="Measure Line Segment" iconName="blank" />  {#segment}

Create a line segment with length controlled by a Measurement Object

::: details Future:

- Select or create a start point, a direction point, and then select a measurement from the [Measurement Section of the Objects List](/userguide/toolsobjectspanel#objects-list). to determine the length. The result is a line segment (with length of the measurement) starting at start point and heading toward/away (depending on the sign of the measurement) the direction point.
- If the measurement is more than $2\pi$ or less than $-2\pi$ then only a line is drawn.
- A new non-movable point is created at the end of the measured line segment.
- When a Measured Line Line Segment is created, a row describing some of its properties will appear in the Line Segment Section of the [Objects Tab](/userguide/#objects-tab) <icon-base  iconName="objectsTab"> </icon-base>.
- When this tool is activated all previously selected objects are unselected and ignored.

:::

## <ToolTitle title="Measure Angle Line" iconName="blank" />  {#angle}

Create a line at a measured angle to a given line (or line segment) and through a point on that line.

::: details Future:

- Select a line (or line segment) and a point on that line (or line segment) and select a measurement from the [Measurement Section of the Objects List](/userguide/toolsobjectspanel#objects-list) to determine the angle.
- Positive measurement values are counterclockwise angles and negative are clockwise (when seen from outside of the sphere).
- When a Measured Angle Line is created, a row describing some of its properties will appear in the Line Section of the [Objects Tab](/userguide/#objects-tab) <icon-base  iconName="objectsTab"> </icon-base>.
- When this tool is activated all previously selected objects are unselected and ignored.

:::

## <ToolTitle title="Measure Circle" iconName="measuredCircle" />  {#circle}

Create a circle with radius controlled by a Measurement Object

::: info Creating measured circle:

- Select (or create) a center point and select a measurement from the [Measurement Section of the Objects List](/userguide/toolsobjectspanel#objects-list) to determine radius of the circle.
- The value modulo $2\pi$ of the measurement token's value determines the radius of the circle.
- When a Measured Circle is created, a row describing some of its properties will appear in the Circle Section of the [Objects Tab](/userguide/#objects-tab) <icon-base  iconName="objectsTab"> </icon-base>.
- When this tool is activated all previously selected objects are unselected and ignored.
  :::

## <ToolTitle title="Measured Circular Arc" iconName="blank" />  {#circularArc}

Create an arc of a circle with arc length controlled by a Measurement Object.

::: details Future:

- Click to declare two points (these might be new free points or ones that snap to an existing point, object or intersection) to define the circular arc. The first point is the center of the circular arc and the second is the start point of the circular arc (and determines the radius). Then select a measurement from the [Measurement Section of the Objects List](/userguide/toolsobjectspanel#objects-list) to determine the arc length of the circle that is displayed.
- The circular arc starts at the second point and proceeds counterclockwise (seen from outside of the sphere) if the measurement is positive or clockwise if the measurement is negative.
- If the measurement is larger than $2\pi\sin(r)$ or less than $-2\pi\sin(r)$, the entire circle is drawn.
- When an ellipse is created, a row describing some of its properties will appear in the Circle Section of the [Objects Tab](/userguide/#objects-tab) <icon-base  iconName="objectsTab"> </icon-base>.
- If this tool is activated with three points selected, the above action is performed automatically where the first two points are the foci of the ellipse and the third is the point on the ellipse.

:::
