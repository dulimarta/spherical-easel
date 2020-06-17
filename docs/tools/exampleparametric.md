---
prev: /tools/advanced.html#parametric-curve-user-defined
next: /tools/advanced.html#parametric-curve-user-defined
---

# Cardioids

Given a circle and a point on that circle, a cardioid is the locus of points that are the reflection of that point over all tangent lines to the circle. Suppose the given circle is centered at the north pole with a radius of $r$ and the point (which is a cusp point) is the point of the circle over the positive $x$-axis. Then the cardioid is parameterized as $P(t) = \langle x(t), y(t), z(t)\rangle$ where

$x(t) = \sin(r) + 2 \cos(r)^2 \sin(r) (\cos(t) - \cos(t)^2)$

$y(t)= 2 \cos(r)^2 \sin(r) \sin(t) (1 - \cos(t))$

$z(t) =  \cos(r) - 2 \cos(r) \sin(r)^2 (1 - \cos(t))$,

where $t_l=0$ and $t_u=2\pi$, the curve is closed, but as $P(0) = P(2\pi)$ is a cusp point, it is better to render this as an open curve.
