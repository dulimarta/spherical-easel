
# Mapping from Hyperboloid to Klein

A point $(x,y,z)$ on a hyperboloid sheet is mapped to the Klein disk at $z=1$

```math
\left(\frac{x}{z}, \frac{y}{z}, 1\right)
```

When the Klein disk is translated to  $z = h$, the coordinates become

```math
\begin{equation}
\left(\frac{hx}{z}, \frac{hy}{z}, h\right)
\end{equation}
```

A Klein point at $(x_K, y_K)$ is mapped to a Poincare point
$(x_P,y_P)$ at

```math
\begin{align}
(x_P,y_P) &=
\left(
    \frac{2x_K}{1+x_K^2 + y_K^2},
    \frac{2y_K}{1+x_K^2 + y_K^2}
\right)\\
&= 
\left(
    \frac{2\frac{hx}{z}}
    {1 + \left(\frac{hx}{z}\right)^2 + \left(\frac{hy}{z}\right)^2},
    \frac{2\frac{hy}{z}}
    {1 + \left(\frac{hx}{z}\right)^2 + \left(\frac{hy}{z}\right)^2}
\right)\\
&= \frac{2h}{z}
\left(
    \frac{x}
    {1 + \frac{h^2x^2 + h^2y^2}{z^2}},
    \frac{y}
    {1 + \frac{h^2x^2 + h^2y^2}{z^2}}
\right)\\
&= \frac{2h}{z}
\left(
    \frac{x}
    {1 + h^2\frac{x^2 + y^2}{z^2}},
    \frac{y}
    {1 + h^2\frac{x^2 + y^2}{z^2}}
\right)\\
\end{align}
```

But a point $(x,y,z)$ on a two-sheet **unit** hyperboloid satisfies
$$x^2+y^2-z^2 = -1\quad\text{or}\quad x^2+y^2 = z^2 - 1$$
Therefore,

```math
(x_P,y_P) = \frac{2h}{z}
\left(
    \frac{x}
    {1 + h^2\frac{z^2 - 1}{z^2}},
    \frac{y}
    {1 + h^2\frac{z^2 - 1}{z^2}}
\right) = \frac{2h}{z + h^2\frac{z^2 - 1}{z}}
(x, y)
```
