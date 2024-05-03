---
prev: /userguide/toolsobjectspanel.html#parametric-curve-panel
next: /userguide/toolsobjectspanel.html#parametric-curve-panel
---

# Cardioids

Given a circle and a point on that circle, a cardioid is the locus of points that are the reflection of that point over all tangent lines to the circle. Suppose the given circle is centered at the north pole with a radius of $r$ and the point (which is a cusp point) is the point of the circle over the positive $x$-axis. Then the cardioid is parameterized as $P(t) = \langle x(t), y(t), z(t)\rangle$ where

- $x(t) = \sin(r) + 2 \cos(r)^2 \sin(r) (\cos(t) - \cos(t)^2)$

- $y(t)= 2 \cos(r)^2 \sin(r) \sin(t) (1 - \cos(t))$

- $z(t) =  \cos(r) - 2 \cos(r) \sin(r)^2 (1 - \cos(t))$,

and $0 \leq t \leq 2\pi$. There are cusp points at the values of 0 and $2\pi$ although as $P(0) = P(2\pi)$ the curve is closed.

## Entering the cardioid in Spherical Easel

Suppose the user has a Measurement Token, M1, that will control the radius and they want the curve to be drawn between Measurement Tokens M2 and M3. In Parametric Formulas panel, the user would enter

- sin(M1) + 2\*cos(M1)^2\*sin(M1)\*(cos(t) - cos(t)^2) in the X(t) formula box,
- 2\*cos(M1)^2\*sin(M1)\*sin(t)\*(1 - cos(t)) in the Y(t) formula box, and
- cos(M1) - 2\*cos(M1)\*sin(M1)^2\*(1 - cos(t)) in the Z(t) formula box.

In the Optional Tracing Expressions panel they would enter

- M2 in the Minimum Parameter Tracing Expression box and
- M3 in the Maximum Parameter Tracing Expression box.

In the boxes at the bottom, they would enter

- 0 in the Minimum Parameter(t) value box,
- 2\*pi in the Maximum Parameter(t) value box, and
- 0, 2\*pi in the Cusp t values box.
