
# Reference: https://bun.com/docs/guides/ecosystem/docker

# Run the following docker command to build the image (notice the DOT at the end)
#     docker build -t dulimarta/easelgeo .
# Run the following docker command to run the image
#     docker run -p 8080:8080 dulimarta/easelgeo


FROM oven/bun:1 AS base


FROM base AS install-stage
WORKDIR /usr/src/app
# RUN mkdir -p /temp/dev
# Copy from local into the image
COPY package.json bun.lock ./
RUN bun install

# FROM base AS prerelease-stage
# COPY --from=install-stage /temp/dev/node_modules /usr/src/app/node_modules
COPY . .

# USER bun
# This is the port number specified in vite.config.mts
EXPOSE 8080
ENTRYPOINT ["bun", "--bun", "run", "app:serve"]
