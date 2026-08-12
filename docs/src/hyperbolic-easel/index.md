# Design Differences between Hyperbolic and Spherical Easel

## HyperbolicFrame.vue

This component is the counterpart of `SphereFrame.vue`.

## Mouse Handling

Taking advantage of ThreeJS Raycaster, mouse handling functions in Hyperbolic Easel are provided
with extra arguments:

* 3D position and surface normal where the mouse ray intersect the hyperboloid
* 2D normalized cursor position in the canvas window. This information may be useful for placing a text box annotations (detached from any geometric objects)

For instance, the signature of the `mouseMoved` event becomes:

```
mouseMoved(
  event: MouseEvent,
  normalizedScreenPosition: Vector2,
  position: Vector3 | null,
  normalDirection: Vector3 | null): void;
```

The `position` and `normalDirection` arguments are null when the mouse is not on the hyperboloid.

To pass these additional data, the `mousemove` is first handled in `HyperbolicFrame.vue`.

## HENodule (abstract base class)

Some differences with `SENodule`:

* With the RayCasting feature provided by ThreeJS there is no need to implement `isHitAt` anymore.
* Decoupling the `models` and `plottables` does not seem to improve the design of Spherical Easel.
  Instead, it seems to increase coupling between the two associated classes under each group.
  For Hyperbolic Easel, the 3D drawing/"plotting" logic is currently included in the model classes.
* To allow designing geometric objects from multiple ThreeJS geometries (`CubeGeometry`, `SphereGeometry`, `PlaneGeometry`, etc.) the abstract base class `HENodule` defines a `group` (type `THREE.Group`) where multiple ThreeJS objects can be pushed to.

## Pinia Store: `hyperbolic.ts`

This store is the counterpart of `stores/se.ts`. To facilitates integration with the existing UI, 
the `actionMode` variable in `stores/se/ts` is **reused** when we switched to hyperbolic mode.