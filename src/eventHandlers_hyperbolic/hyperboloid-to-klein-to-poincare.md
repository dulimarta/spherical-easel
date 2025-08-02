
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

For points inside the disk of Radius $R$, Poincar&egrave; is always closer the center
than its Klein counter part. If $d_P$ is the distance of a Poincare point
to the center of the disk and $d_K$ is the distance its associated Klein
point to the center of the disk, then $d_P < d_K$.

On a unit disk, these two distances are related by:

```math
d_K = \frac{2d_P}{1 + d_P^2}
\qquad
d_P = \frac{d_k}{1 + \sqrt{1 -  d_K^2}}
```

## Derivation via Projection?

Or direct from "perspective project" with center at $(0,0,-1)$ and projection plane at $z=d$
$$
(x_P, y_P) = \frac{d+1}{z+1}(x,y)