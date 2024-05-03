# Spherical Geometry

## Prerequisite for Building/Compiling the app

1. Download and install [NodeJS](https://nodejs.org/en/download/). Verify that `node` and `npm` are installed correctly by typing

   ```bash
   node -v        # Version 10.16.3 (or newer)
   npm -v          # version 6.13.2 (or newer)
   ```

2. Download and install [Bun](https://bun.sh). Verify `bun` installation by typing

   ```bash
   bun -v         # version 1.1.x (or newer)
   ```

## Setting Up for Development

In the project top directory. Type `bun install` to install external dependencies required by the project. This command must be run when you try to build the project for the first time.

```bash
# Install external dependencies (required for the first time)
bun install
```

### Compiles and hot-reloads for development

```bash
# Start the app on a local server
bun app:serve
# Start both the app server and vitepress server
bun serve
```

After typing `bun app:serve`, use your browser to open `localhost:8080` (or whatever port number indicated by `bun`).

### Optional commands

```bash
bun build        # to build for production
bun docs:build   # to build the documentation
```

### Documentation

The `docs` subdirectory is reserved for documentation files built using [VitePress](https://vitepress.dev/).

To view the documentation page:

```bash
bun docs:serve
```

To build the documentation page:

```bash
yarn docs:build    # do this AFTER `bun build`
```

After a successful document build, you will find a new directory `dist/docs`.
