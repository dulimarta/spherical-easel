# Spherical Geometry

## Prerequisite for Building/Compiling the app

1. Download and install [NodeJS](https://nodejs.org/en/download/). Verify that `node` and `npm` are installed correctly by typing

   ```bash
   node -v        # Version 10.16.3 (or newer)
   npm -v          # version 6.13.2 (or newer)
   ```

2. Download and install [Yarn](https://classic.yarnpkg.com/en/docs/install#mac-stable). Verify `yarn` installation by typing

   ```bash
   yarn -v         # version 1.22.4 (or newer)
   ```

## Setting Up for Development

In the project top directory. Type `yarn install` to install external dependencies required by the project. This command must be run when you try to build the project for the first time.

```bash
# Install external dependencies (required for the first time)
yarn install
```

### Compiles and hot-reloads for development

```bash
# Start the app on a local server
yarn app:serve
```

After typing `yarn serve`, use your browser to open `localhost:8080` (or whatever port number used by `yarn serve`).

### Optional commands

```bash
yarn app:build    # to build for production
yarn lint         # to run linter program
```

### Documentation

The `docs` subdirectory is reserved for documentation files built using [VuePress](https://vuepress.vuejs.org/).

To view the documentation page:

```bash
yarn docs:serve
```

To build the documentation page:

```bash
yarn docs:build    # do this AFTER `yarn build`
```

After a successful document build, you will find a new directory `dist/docs`.


## Launching With Docker

1. Build a docker image from `Dockerfile`

   ```
   # The image will be assigned a tag name easelgeo
   docker build -t DDDDDDDD/easelgeo --no-cache .
   ```

   To push the image to [Docker Hub](`docker.io`), use your Docker userid in place of `DDDDDDDD`.


   ```
   docker run -it -p 9000:80 --rm --name easelgeo-app DDDDDDDD/easelgeo
   ```

   or

   ```
   docker-compose up --build
   ```

3. Connect to `localhost:9000` from a browser (port 8080 in the container is mapped a port 9000 on the host)
