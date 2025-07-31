# Plane-Conic Intersections

The technique describe below is based on the following paper:

>  Peter Paul Klein, "On the Intersection Equation of a > Hyperboloid and a Plane", _Applied Mathematics_, 2013, 4, 40-49

## Intersection With HHyperboloid
General equation of hyperboloid:

$$
\frac{x^2}{a^2} + \frac{y^2}{b^2} - \frac{z^2}{c^2} = \pm 1
$$

For a **unit** two-sheet hyperboloid all coefficients are unitary and the
right-hand is negative.
$$
x^2 + x^2 - x^2 = -1
$$

expressed as matrix multiplications:

```math
\begin{equation}
\begin{bmatrix}
x & y & z
\end{bmatrix}
\begin{bmatrix}
  1 & 0 & 0\\
  0 & 1 & 0\\
  0 & 0 & 1
\end{bmatrix}
\begin{bmatrix}
  1 & 0 & 0\\
  0 & 1 & 0\\
  0 & 0 & -1
\end{bmatrix}
\begin{bmatrix}
x\\y\\z
\end{bmatrix}
 = -1
\end{equation}
```


Shorthand notation for the diagonal matrix as an operator
$$
D_\pm  = 
\begin{bmatrix}
  1 & 0 & 0\\
  0 & 1 & 0\\
  0 & 0 &\pm 1
\end{bmatrix}
\qquad\text{and}\qquad
D_\pm\mathbf{x}  = 
\begin{bmatrix}
  1 & 0 & 0\\
  0 & 1 & 0\\
  0 & 0 &\pm 1
\end{bmatrix}
\begin{bmatrix}
x\\y\\z
\end{bmatrix}\quad
(D_\pm\mathbf{x})^t  = 
\begin{bmatrix}
x & y & z
\end{bmatrix}
\begin{bmatrix}
  1 & 0 & 0\\
  0 & 1 & 0\\
  0 & 0 &\pm 1
\end{bmatrix}
$$

Using the above $D$ operator and inner product notation $\langle A, B \rangle = A^tB$, Eq (1) becomes

```math
\begin{equation}
\langle D_+\mathbf{x}, D_-\mathbf{x}\rangle = -1
\end{equation}
```

A point $\mathbf{p}$ on a plane $K$ that passes through another point $\mathbf{q}$ can be parameterized as
$$\mathbf{p} = \mathbf{q} + \lambda \mathbf{a} + \mu \mathbf{b}$$

In our case, the planes of interest pass through the origin, therefore $\mathbf{q} = 0$ and the plane
equation simplifies to $\mathbf{p} = \lambda \mathbf{a} + \mu \mathbf{b}$.
Hence the intersection between the plane and the hyperboloid is a hyperbola.

For a point $\mathbf{p}$ on the plane $K$ that intersects a hyperboloid, they have to satisfy:

```math
\begin{align*}
\langle D_+\mathbf{p}, D_-\mathbf{p}\rangle &= -1\\
\langle D_+(\lambda a + \mu b),D_-(\lambda a + \mu b)\rangle &= -1\\
\lambda^2 \langle D_+\mathbf{a},D_-\mathbf{a}\rangle + 
\mu^2 \langle D_+\mathbf{b},D_-\mathbf{b}\rangle +
2\lambda\mu \langle D_+\mathbf{a},D_-\mathbf{b}\rangle &= -1
\end{align*}
```

Both $\mathbf{a}$ and $\mathbf{b}$ can be chosen such that $ \langle D_+\mathbf{a},D_-\mathbf{b}\rangle = 0$ and the equation simplifies further to

$$\lambda^2 \langle D_+\mathbf{a},D_-\mathbf{a}\rangle + 
\mu^2 \langle D_+\mathbf{b},D_-\mathbf{b}\rangle = -1$$

Expressed as a hyperbola in the $(\lambda,\mu)$ coordinates

$$\frac{\lambda^2}{a^2} - \frac{\mu^2}{b^2} = -1$$
we obtain
$$
\frac{1}{a^2} = \langle D_+\mathbf{a},D_-\mathbf{a}\rangle 
\qquad\text{and}\qquad
  \frac{1}{b^2} = - \langle D_+\mathbf{b},D_-\mathbf{b}\rangle 
$$

## Choosing $\mathbf{a}$ and $\mathbf{b}$

In our case, $\mathbf a$ and $\mathbf b$ are chosen as follows:

* The plane $K$ normal ($\mathbf{n}$) is computed from the cross product of the start and end points of a line/segment
* $\mathbf{a}$ is determined from the cross product of $\mathbf{n}$ and the Z-axis. Technically, $\mathbf{a}$ has two roles:
  
  * the direction of the intersection line between the plane $K$ and the XY-plane. Because $\mathbf{a}$ is on the XY-plane its $z$-coordinate is *zero* and $\langle D_+,D_-\rangle$ becomes an ordinary dot product.
  * the normal vector of another plane ($L$) that cuts through the center of the hyperbola, i.e. the hyperbola is self-mirrored
    on this plane $L$

* $\mathbf{b} = \mathbf{a} \times \mathbf{n}$ is a vector on a plane perpendicular to the XY plane.

## Rendering As a Parametric Curve
The hyperbola can be rendered as a parametric curve using one of the parametrization below:

* $\lambda(\theta) = a \sec \theta, \mu(\theta) = b \tan \theta$ or
* $\lambda(\theta) = \pm a \cosh \theta, \mu(\theta) = b \sinh \theta$

## Intersection With A Sphere

Intersection of a plane through origin with equation $\lambda\mathbf{a} + \mu\mathbf{b}$ and the sphere or radius 1. In this case, Equation (2) becomes
an ordinary dot product:

```math
\begin{equation}
\langle D_+\mathbf{x}, D_+\mathbf{x}\rangle = +1
\end{equation}
```

```math
\begin{align}
(\lambda \mathbf{a} + \mu \mathbf{b})^t(\lambda \mathbf{a} + \mu \mathbf{b}) &= 1\\
\lambda^2  \mathbf{a}^t \mathbf{a} + \mu^2 \mathbf{b}^t \mathbf{b} + 2\lambda\mu \mathbf{a}^t \mathbf{b}  & = 1\\
\end{align}
```

By chosing $\mathbf{a}$ and $\mathbf{b}$ to be unit and orthogonal vectors
$$\lambda^2   + \mu^2   = 1$$

and the circle can be parameterized as 
$$\lambda(t) = \cos(t) \qquad \mu(t) = \sin(t)$$