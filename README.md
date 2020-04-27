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
yarn serve
```

After typing `yarn serve`, use your browser to open `localhost:8080` (or whatever port number used by `yarn serve`).

### Optional commands

```bash
yarn build        # to build for production
yarn lint         # ro run linter program
```
