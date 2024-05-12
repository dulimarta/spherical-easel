---
title: Advanced Tools
lang: en-US
---

# Advanced Tools

These tools create geometric objects based on existing objects and user input.

## <ToolTitle title="Circular Arc" iconName="blank" />  {#circular}

Create an arc of a circle.

::: details Future:

- Click to declare three points (these might be new free points or ones that snap to an existing point, object or intersection) to define the circular arc. The first point is the center of the circular arc, the second is the start point of the circular arc (and determines the radius), and the third is used to define the direction and length of the circular arc. The third point determines the angle of the arc (formed by the line segments of length les than $\pi$ from the first to second points and from the first to third points) and the side of the line containing the first two points on which the arc is drawn. (The points must be pairwise non-antipodal.)
- When an ellipse is created, a row describing some of its properties will appear in the Circle Section of the [Objects Tab](/userguide/#objects-tab) <icon-base  iconName="objectsTab"> </icon-base>.
- If this tool is activated with three points selected, the above action is performed automatically where the first two points are the foci of the ellipse and the third is the point on the ellipse.
  :::

## <ToolTitle title="Toggle Circular Arc" iconName="blank" />  {#toggle}

Toggle a circular arc.

::: details Future:

- Mouse releasing on a circular arc, toggles the circular arc between having arc length less than or equal to $\pi\sin(r)$ to greater than or equal to $\pi\sin(r)$ where $r$ is the radius of the circular arc.
- If this tool is activated with a circular arc selected the above action is performed automatically.

:::

## <ToolTitle title="N-Sect Segment" iconName="nSectPoint" />  {#segment}

Create all the points that divide a line segment into N equal parts.

::: info N-Secting a segment:

- Select an existing line segment while holding down a number (N) key on the keyboard to N-Sect it.
- Holding down the 0 key divide the segment into the maximum of 10 equal segments.
- Holding down the 1 key results in an error.
- When N-Secting points are created, N rows will appear in the Points Section of the [Objects Tab](/userguide/#objects-tab) <icon-base  iconName="objectsTab"> </icon-base> each describing some of its properties.
- If this tool is activated with a line segment or two points selected, the above action is performed automatically.

:::

## <ToolTitle title="N-Sect Angle" iconName="nSectLine" />  {#angle}

Create all the lines that divide an angle into N equal angles.

::: n-Secting an angle:

- Select an existing measured angle while holding down a number (N) key on the keyboard to N-Sect it.
- Note: you have to measure an angle before this tool can be used.
- Holding down the 0 key divide the segment into the maximum of 10 equal segments.
- Holding down the 1 key results in an error.
- When N-Secting lines are created, N rows will appear in the Lines Section of the [Objects Tab](/userguide/#objects-tab) <icon-base  iconName="objectsTab"> </icon-base> each describing some of its properties.
- If this tool is activated with an angle selected, the above action is performed automatically.

:::

## <ToolTitle title="Three Point Circle" iconName="threePointCircle" />  {#three}

Create a circle with its center point defined by three points.

::: info Creating three point circle:

- Click to declare or select three points (these might be new free points or ones that snap to an existing point, object or intersection) on the circle.
- The center of the circle is also created in such a way that the radius of the circle is always less then or equal to $\frac{\pi}{2}$.
- When an circle is created, a row describing some of its properties will appear in the Circle Section of the [Objects Tab](/userguide/#objects-tab) <icon-base  iconName="objectsTab"> </icon-base>.
- If this tool is activated with three points selected, the above action is performed automatically.
  :::

## <ToolTitle title="Five Point Conic" iconName="blank" />  {#five}

Create the conic defined by 5 points.

::: details Future:

- This is a special type of ellipse.
- More research has to go into this one. I'm not sure how to construct this or even if it is unique or even exists. Five points in the place define a conic, but on the sphere? I don't know.
- When a Five Point Conic is created, a row describing some of its properties will appear in the Conics Section of the [Objects Tab](/userguide/#objects-tab) <icon-base  iconName="objectsTab"> </icon-base>.
- If this tool is activated with five points selected, the above action is performed automatically.
  :::

## <ToolTitle title="Holonomy" iconName="blank" />  {#holonomy}

## <ToolTitle title="Parallel Transport" iconName="blank" />  {#parallel}

## <ToolTitle title="Center of Similitude" iconName="blank" />  {#similitude}

## <ToolTitle title="Radical Axis" iconName="blank" />  {#axis}

## <ToolTitle title="Radial Center" iconName="blank" />  {#center}


Vapor-tools for exploring some advanced topics in spherical geometry.

::: details Future:
This is a long term wish list.

- Spherical [Radical Axis](https://en.wikipedia.org/wiki/Radical_axis), [Radical Center](https://www.google.com/books/edition/A_Treatise_on_Spherical_Trigonometry/4IsLAAAAYAAJ?hl=en&gbpv=1&dq=radical+axis+M%27Clelland,+Thomas+Preston&pg=PA123&printsec=frontcover) page 121 of William J. M'Clelland, Thomas Preston A Treatise on Spherical Trigonometry: With Applications to ..., Volume 1

- [Center of Similitude](https://www.google.com/books/edition/A_Treatise_on_Spherical_Trigonometry/4IsLAAAAYAAJ?hl=en&gbpv=1&dq=Center+of+Similitude++M%27Clelland,+Thomas+Preston&pg=PA132&printsec=frontcover) page 132 of William J. M'Clelland, Thomas Preston A Treatise on Spherical Trigonometry: With Applications to ..., Volume 1
  :::
