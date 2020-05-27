# Design

Some files under this directory may have a unique association with files in the `plotables` directory.
For instance, `SEPoint` in this directory is associated with `plotables/Point`.

- Classes under this directory should be independent of the graphical library chosen for rendering the visual appearance of the geometric objects.
- Classes under the `plotables` directory should be mainly be responsible for rendering the visual appearance (color, line style, shading, etc.) on the canvas.