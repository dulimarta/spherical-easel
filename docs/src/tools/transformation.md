---
title: Transformation Tools
lang: en-US
---

# Transformation Tools

Each of these tools is used to create a transformation from the sphere to itself or to apply such a transformation to objects on the sphere.

## <ToolTitle title="Create Reflection Over Point" iconName="pointReflection" />  {#pointReflection}

Create a reflection over a point.

::: info Creating a point reflection:

- Select (or create) a point over which to reflect.
- The user can apply the reflection over a point to objects using the [Apply Transformation Tool](/tools/transformation#apply-transformation).
- When a Reflection is created, a row describing some of its properties will appear in the Transformation Section of the [Objects Tab](/userguide/#objects-tab) <icon-base  iconName="objectsTab"> </icon-base>.
- If this tool is activated with a line or line segment, the above action is performed automatically.

:::

## <ToolTitle title="Create Reflection" iconName="reflection" />  {#reflection}

Create a reflection over a line or line segment.

::: info Create line reflection:

- Select a line (or line segment) to reflect over.
- If a line segment is selected, the reflection is over the line containing the line segment.
- The user can apply the reflection to objects using the [Apply Transformation Tool](/tools/transformation#apply-transformation).
- When a reflection is created, a row describing some of its properties will appear in the Transformation Section of the [Objects Tab](/userguide/#objects-tab) <icon-base  iconName="objectsTab"> </icon-base>.
- If this tool is activated with a line or line segment selected, the above action is performed automatically.

:::

## <ToolTitle title="Create Measured Rotation" iconName="rotation" />  {#measureRotation}

Create a rotation about a point by a measured quantity.

::: info Creating a measured rotation:

- Select (or create) a point around which to rotate and select a measurement from the [Measurement Section of the Objects List](/userguide/toolsobjectspanel#objects-list) to determine the angle of rotation.
- Positive measurement values are counterclockwise rotations and negative are clockwise (when seen from outside of the sphere).
- The user can apply the rotation to objects using the [Apply Transformation Tool](/tools/transformation#apply-transformation).
- When a rotation is created, a row describing some of its properties will appear in the Transformation Section of the [Objects Tab](/userguide/#objects-tab) <icon-base  iconName="objectsTab"> </icon-base>.
- When this tool is activated all previously selected objects are unselected and ignored.
  :::

## <ToolTitle title="Create Translation" iconName="translation" />  {#translation}

Create a translation along a line segment.

::: Create translation:

- Select a line segment to translate along.
- A translation along a line segment is the same as rotating around a pole of the line segment by an angle equal to the [length](/tools/measurement#length) of the line segment.
- The user can apply the translation to objects using the [Apply Transformation Tool](/tools/transformation#apply-transformation).
- When a translation is created, a row describing some of its properties will appear in the Transformation Section of the [Objects Tab](/userguide/#objects-tab) <icon-base  iconName="objectsTab"> </icon-base>.
- If this tool is activated with a line segment selected, the above action is performed automatically.

:::

## <ToolTitle title="Create Inversion" iconName="inversion" />  {#inversion}

Create a inversion over a circle.

::: info Creating an inversion:

- Select a circle over which to invert.
- See [page 138](https://books.google.com/books?id=BSU4AAAAMAAJ&printsec=frontcover&source=gbs_ge_summary_r&cad=0#v=snippet&q=spherical%20inversions&f=false) of "A Treatise on Spherical Trigonometry: With Applications to Spherical Geometry and Numerous Examples", Volume 1
  by William J. M'Clelland, Thomas Preston, 1893.
- The user can apply the inversion to objects using the [Apply Transformation Tool](/tools/transformation#apply-transformation).
- When an inversion is created, a row describing some of its properties will appear in the Transformation Section of the [Objects Tab](/userguide/#objects-tab) <icon-base  iconName="objectsTab"> </icon-base>.
- If this tool is activated with a circle selected, the above action is performed automatically.

:::

## <ToolTitle title="Apply Transformation" iconName="applyTransformation" />  {#transformation}

Apply a previously created transformation to objects

::: info Apply a transformation:

- Select a transformation from the Transformation Section of the [Objects Tab](/userguide/#objects-tab) <icon-base  iconName="objectsTab"> </icon-base> to determine which transformation to apply. After this all mouse release events will transform a selected object according to the transformation selected.
- Notice that after you have selected a transformation to apply a snackbar message across the bottom of the screen indicates which transformation you are applying.
- Transformations cannot be applied to Parametric Curves, Text, Angle Markers, Labels, and Sliders.
- When this tool is activated all previously selected objects are unselected and ignored.

:::
