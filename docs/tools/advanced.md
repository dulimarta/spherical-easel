---
title: Advanced Tools
lang: en-US
---

# Advanced Tools

These tools create geometric objects based on existing objects and user input.

::: tool-title

## Circular Arc

:::
::: tool-description
Create an arc of a circle.
::: tool-details

- Click to declare three points (these might be new free points or ones that snap to an existing point, object or intersection) to define the circular arc. The first point is the center of the circular arc, the second is the start point of the circular arc (and determines the radius), and the third is used to define the direction and length of the circular arc. The third point determines the angle of the arc (formed by the line segments of length les than $\pi$ from the first to second points and from the first to third points) and the side of the line containing the first two points on which the arc is drawn. (The points must be pairwise non-antipodal.)
- When an ellipse is created, a row describing some of its properties will appear in the Circle Section of the [Objects Tab](/userguide/#objects-tab).
- If this tool is activated with three points selected, the above action is performed automatically where the first two points are the foci of the ellipse and the third is the point on the ellipse.
  :::

::: tool-title

## Toggle Circular Arc

:::

::: tool-description

Toggle a circular arc.

::: tool-details

- Mouse releasing on a circular arc, toggles the circular arc between having arc length less than or equal to $\pi\sin(r)$ to greater than or equal to $\pi\sin(r)$ where $r$ is the radius of the circular arc.
- If this tool is activated with a circular arc selected the above action is performed automatically.

:::

::: tool-title

## N-Sect Segment

:::
::: tool-description
Create some or all the points to divide a line segment or the shortest length between two points into N equal parts.
::: tool-details

- There are two different ways of selecting or creating N-Secting points:
  - If a line segment is selected it is N-Sected.
  - If two points are selected (or created by clicking at two locations) then there are two cases:
    - If the points are antipodal then the N-Secting points don't exist and nothing is created. However, the N-Secting points are still created and if later the points are moved to a non-antipodal locations the N-Secting points will appear.
    - If the points are not antipodal it is assumed that the line segment (not displayed or created) connecting the two points has length less than $\pi$ and the N-Secting points of that line segment are created.
- Once a line segment to N-Sect has been selected or created, a dialog box prompts the user for the value of N and an optional list numbers (each less than N-1 separated by commas) of which N-Secting points to show (the rest are hidden). For example if N=6 and the list is 1, 3 then the first (i.e. closest to the first selected/created point in the line segment) and middle N-Secting points are displayed and the rest are hidden. An empty list means that all N-Secting points are shown.
- When N-Secting points are created, N rows will appear in the Points Section of the [Objects Tab](/userguide/#objects-tab) each describing some of its properties.
- If this tool is activated with a line segment or two points selected, the above action is performed automatically.
  :::

::: tool-title

## N-Sect Angle

:::
::: tool-description
Create some or all the lines to divide an angle into N equal angles.
::: tool-details

- There are three different ways of selecting or creating an angle to N-Sect:
  - If a pair of lines (or line segments with a common endpoint) is selected, then which angle is N-Sected depends on the order in which the lines (or line segments) were selected and the right-hand rule. If you place your right hand at one of the intersection points of the lines (or the common endpoint of the line segments) with your thumb pointing away from the center of the sphere and your fingers in the direction of the first line (or line segment) then as you curl your fingers toward the second line (or line segment), the region swept out is the angle that is N-Sected.
  - If a triple of points is selected (or created) then the order in which the points were selected matters. The angle to be N-Sected is determined using the right hand rule as above assuming that there is a line segment (not necessarily shown or created) from the first to the second point and a line segment (not necessarily shown or created) from the second to the third point each of which has length less than $\pi$.
- Once a angle to N-Sect has been selected or created, a dialog box prompts the user for the value of N and an optional list numbers (each less than N-1 separated by commas) of which N-Secting lines to show (the rest are hidden). For example if N=6 and the list is 1, 3 then the first (i.e. closest to the first selected/created line in the angle) and middle N-Secting lines are displayed and the rest are hidden. An empty list means that all N-Secting points are shown.
- When N-Secting lines are created, N rows will appear in the Lines Section of the [Objects Tab](/userguide/#objects-tab) each describing some of its properties.
- If this tool is activated with two lines or two line segments with a common endpoint or a triple of points selected, the above action is performed automatically.
  :::
  ::: tool-title

## Three Point Circle

:::
::: tool-description
Create a circle defined by three points.
::: tool-details

- Click to declare three points (these might be new free points or ones that snap to an existing point, object or intersection) on the circle.
- When an circle is created, a row describing some of its properties will appear in the Circle Section of the [Objects Tab](/userguide/#objects-tab).
- If this tool is activated with three points selected, the above action is performed automatically.
  :::

::: tool-title

## Parametric Curve (User defined)

:::

::: tool-description
Create a curve based on user supplied parametric description.
::: tool-details

- Activating this tool creates a dialog box where the user can enter the parametric description of a spherical curve.
- The curve can be entered in $P(t) = \langle x(t), y(t), z(t)\rangle$ format where the curve is traced out for $t$ values between lower ($t_l$) and upper ($t_u$) bounds, both user supplied. Here is an [example](/tools/exampleparametric).
- The parametric description can depend on a Measurement Token.
- If the $z(t)$ argument is missing it is assumed that $z(t) = \sqrt{1- (x(t)^2 + y(t)^2)}$.
- The curve can be open or closed. Closed means the curve drawn so as to connect $P(t_l)$ and $P(t_u)$. Although if $P(t_l) = P(t_u)$ and this is a cusp point, it may be better to have this drawn as open curve.
- When drawn the curve is scaled so $||P(t)|| =1$ for all $t$.
- An optional parameter sets the number of points used to sample the curve. A larger number will be drawn in more detail, but may slow the app. The default is ????.
- A parametric curve can be edited in the Advanced Tab of the Style Panel.
- When a parametric curve is created, a row describing some of its properties will appear in the Parametric Section of the [Objects Tab](/userguide/#objects-tab).
- If this tool is activated with any objects selected, they are all unselected and ignored.
  :::

::: tool-title

## Five Point Conic

:::
::: tool-description

Create the conic defined by 5 points.

::: tool-details

- This is a special type of ellipse.
- More research has to go into this one. I'm not sure how to construct this or even if it is unique or even exists. Five points in the place define a conic, but on the sphere? I don't know.
- When a Five Point Conic is created, a row describing some of its properties will appear in the Conics Section of the [Objects Tab](/userguide/#objects-tab).
- If this tool is activated with five points selected, the above action is performed automatically.
  :::

::: tool-title

## Holonomy

## Parallel Transport

## Center of Similitude

## Radial Axis

## Radial Center

:::
::: tool-description
Vapor-tools for exploring some advanced topics in spherical geometry.
::: tool-details
This is a long term wish list.

- Spherical [Radical Axis](https://en.wikipedia.org/wiki/Radical_axis), [Radical Center](https://www.google.com/books/edition/A_Treatise_on_Spherical_Trigonometry/4IsLAAAAYAAJ?hl=en&gbpv=1&dq=radical+axis+M%27Clelland,+Thomas+Preston&pg=PA123&printsec=frontcover) page 121 of William J. M'Clelland, Thomas Preston A Treatise on Spherical Trigonometry: With Applications to ..., Volume 1

- [Center of Similitude](https://www.google.com/books/edition/A_Treatise_on_Spherical_Trigonometry/4IsLAAAAYAAJ?hl=en&gbpv=1&dq=Center+of+Similitude++M%27Clelland,+Thomas+Preston&pg=PA132&printsec=frontcover) page 132 of William J. M'Clelland, Thomas Preston A Treatise on Spherical Trigonometry: With Applications to ..., Volume 1
  :::
