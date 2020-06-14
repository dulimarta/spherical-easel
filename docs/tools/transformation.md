---
title: Transformation Tools
lang: en-US
---

# Transformation Tools

Each of these tools is used to create a transformation from the sphere to itself or to apply such a transformation to objects on the sphere.

::: tool-title

## Create Reflection Over Point

:::
::: tool-description
Create a reflection over a point.
::: tool-details

- Select (or create) a point over which to reflect.
- The user can apply the reflection over a point to objects using the [Apply Transformation Tool](/tools/transformation.html#apply-transformation).
- When a Reflection is created, a row describing some of its properties will appear in the Transformation Section of the [Objects Tab](/userguide/#objects-tab).
- If this tool is activated with a line or line segment, the above action is performed automatically.

:::

::: tool-title

## Create Reflection

:::

::: tool-description
Create a reflection over a line or line segment.
::: tool-details

- Select a line (or line segment) to reflect over.
- If a line segment is selected, the reflection is over the line containing the line segment.
- The user can apply the reflection to objects using the [Apply Transformation Tool](/tools/transformation.html#apply-transformation).
- When a reflection is created, a row describing some of its properties will appear in the Transformation Section of the [Objects Tab](/userguide/#objects-tab).
- If this tool is activated with a line or line segment selected, the above action is performed automatically.
  :::

::: tool-title

## Create (Measured) Rotation

:::

::: tool-description
Create a rotation about a point.
::: tool-details

- Select (or create) a point around which to rotate and select a measurement from the Measurement Section of the [Objects Tab](/userguide/#objects-tab) to determine the angle of rotation.
- Positive measurement values are counterclockwise rotations and negative are clockwise (when seen from outside of the sphere).
- The user can apply the rotation to objects using the [Apply Transformation Tool](/tools/transformation.html#apply-transformation).
- When a rotation is created, a row describing some of its properties will appear in the Transformation Section of the [Objects Tab](/userguide/#objects-tab).
- When this tool is activated all previously selected objects are unselected and ignored.
  :::

::: tool-title

## Create Translation

:::
::: tool-description
Create a translation along a line segment.
::: tool-details

- Select a line segment to translate along.
- A translation along a line segment is the same as rotating around a pole of the line segment by an angle equal to the [length](/tools/measurement.html#length) of the line segment.
- The user can apply the translation to objects using the [Apply Transformation Tool](/tools/transformation.html#apply-transformation).
- When a translation is created, a row describing some of its properties will appear in the Transformation Section of the [Objects Tab](/userguide/#objects-tab).
- If this tool is activated with a line segment selected, the above action is performed automatically.

:::

::: tool-title

## Create Inversion

:::
::: tool-description
Create a inversion over a circle.
::: tool-details

- Select a circle over which to invert.
- See [page 138](https://books.google.com/books?id=BSU4AAAAMAAJ&printsec=frontcover&source=gbs_ge_summary_r&cad=0#v=snippet&q=spherical%20inversions&f=false) of "A Treatise on Spherical Trigonometry: With Applications to Spherical Geometry and Numerous Examples", Volume 1
  by William J. M'Clelland, Thomas Preston, 1893.
- The user can apply the inversion to objects using the [Apply Transformation Tool](/tools/transformation.html#apply-transformation).
- When an inversion is created, a row describing some of its properties will appear in the Transformation Section of the [Objects Tab](/userguide/#objects-tab).
- If this tool is activated with a circle selected, the above action is performed automatically.

:::

::: tool-title

## Apply Transformation

:::
::: tool-description
Apply a previously created transformation to objects
::: tool-details

- Select a transformation from the Transformation Section of the [Objects Tab](/userguide/#objects-tab) to determine which transformation to apply. After this all mouse release events will transform a selected object according to the transformation selected.
- Notice that after you have selected a transformation to apply a snackbar message across the bottom of the screen indicates which transformation you are applying.
- Transformations cannot be applied to Parametric Curves, Text, Angle Markers, Labels, and Sliders.
- When this tool is activated all previously selected objects are unselected and ignored.

:::
