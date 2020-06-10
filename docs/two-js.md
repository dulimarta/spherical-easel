
The function `Two::setSize(w,h)` sets the `width` and `height` HTML attributes of the **top-level**
`<svg>` element to the given numbers. Calling this function is required when resizing TwoJS canvas.

The boundary circle is always rendered with its "ideal" radius (`SETTINGS.boundaryCircle.radius`) but scaled up/down upon
window resize or split panel resize events. To avoid redrawing the entire scene, we use CSS `transform` property and initialize it with the affine transformation matrix.