
# Reference: https://vuejs.org/v2/cookbook/dockerize-vuejs-app.html
# Use Alpine NodeJS as the base image for both dev and production
FROM node:14.15-alpine as build-stage


# Copy from local into the image
WORKDIR ./

RUN apk add python3 && \
    npm install -g npm@8.3.0 && \
    npm explore npm/node_modules/@npmcli/run-script -g -- npm_config_global=false npm install node-gyp@latest

# node-gyp must be installed globally
# Reference: https://github.com/nodejs/node-gyp/blob/master/docs/Updating-npm-bundled-node-gyp.md

# For NPM 7.x or 8.x

# For older NPM
# RUN npm explore npm/node_modules/npm-lifecycle -g -- npm install node-gyp@latest

# Copy from the host current dir (first arg) into the container current dir (second arg)

COPY package*.json /
COPY . .
RUN npm install && npm run app:build

# Stage 2: Serve the app
FROM nginx:stable-alpine as production-stage
COPY --from=build-stage /dist /usr/share/nginx/html
EXPOSE 80

# CMD ["npm", "run", "app:serve"]
# CMD ["http-server", "dist"]
CMD ["nginx", "-g", "daemon off;"]
