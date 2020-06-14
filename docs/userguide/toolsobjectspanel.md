---
title: Tools and Objects Panel
lang: en-US
---

# Tools & Objects Panel

In the Tools & Objects Panel there are two tabs.

## Tools Tab

There are many tools and they are explained in their own section of this document
[Tools](/tools/).

## Objects Tab

Every time an object is created it is displayed in the sphere canvas and then listed in the this tab. In addition, every measurement creates a row in this tab. This list is sorted by the type of object or measurement displayed:

- [Points](/tools/basic.html#point)
- [Line Segments](/tools/basic.html#line-segment)
- [Lines](/tools/basic.html#line)
- [Circles](/tools/basic.html#circle) (Including [Circular Arcs](/tools/advanced.html#circular-arc))
- [Conics](/tools/conic.html)
- [Polygons](/tools/basic.html#polygon-too-hard)
- [Parametric Curves](/tools/advanced.html#parametric-curve-user-defined)
- [Transformations](/tools/transformation.html)
- [Text](/tools/basic.html#text)
- [Measurements](/tools/measurement.html)
- Calculations

Each row created includes a button/icon to control if the object is hidden or not, the [Definition Text](/userguide/stylepanel.html#definition-text), an icon to pull up a menu that Deletes the object or selects the objects and opens the Style Panel.

### Calculations

Each time a [measurements](/tools/measurement.html) tool is used (or new calculation created) a Measurement Token appears in the row of the Object Tab that describes the measurement. A measurement token is a capital letter M followed by a number. You can use this token in the calculation row (or in the [Advanced Tab](/userguide/stylepanel.html#advanced-tab)) to create custom calculations that are updated as the objects on the sphere are moved. After the Measurement token is some [Definition Text](/userguide/stylepanel.html#definition-text) indicating more information about the measurement.

One example can be found in the [measuring](/quickstart/measure.html#_3-use-the-calculation-row) part of the [Quick Start Guide](/quickstart/) on equilateral triangles.

<!-- Do I need a second example?
Here is a second example verifies that for a right triangle $ABC$ with right angle at side lengths $a$, $b:

- Clear the sphere by selecting the New Option on the blah blah menu.
- Create a circle using the [Circle Tool](/tools/basic.html#circle).
- Measure the distance between the center point of the circle and the point on the circle using the [Distance Tool](/tools/measurement.html#distance). Notice that a new row in the Measurement Section of the Objects Tab is created and that the Measurement token M1 is displayed. -->

You can enter a constant in a calculation row (i.e. an entry with no Measurement Tokens) and then use the created Measurement Token to create a [Line Segment](/tools/basic.html#line-segment) or [Circular Arc](/tools/advanced.html#circular-arc) with a constant length.

### Transformations

Create a transformation then apply it. Give example of creating one and then applying it.
