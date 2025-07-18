Besides ThreeJS TextGeometry, rendering text objects is supported by
* `CSS2DRenderer` and `CSS2DObject`
* `CSS3DRenderer` and `CSS3DObject`
* `Text` (`troika-three-text`)

Setting up the first two has not been successful because of the 
following two issues:
* Text objects are rendered in a separate overlay HTML element 
  (typically a `<div>`). Created text objects are inserted into
  this layer as a CSS(2|3)Object which then requires periodic call to the
  associated renderer with the same arguments as the graphics renderer

  ```
  webGLrenderer.render(camera, scene)
  textRenderer.render(camera, scene)
  ```

* Aligning the text layer (`<div>`) with the WebGL `<canvas>` can be tricky
  and may prevent mouse events to be properly handled by the WebGL canvas.


Text objects from `troika-three-text` are easier to positioned in the 3D scene. 
By default, 3D objects are checked for depth occlusion and the text
may be occluded by other 3D geometric objects. Setting its `depthTest` to false 
on its material property partially to solve the problem. The side effect is that
now the text will never get occluded