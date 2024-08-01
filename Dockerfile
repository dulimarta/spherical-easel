
# Reference: https://vuejs.org/v2/cookbook/dockerize-vuejs-app.html
# Use Alpine NodeJS as the base image for both dev and production

# Run the following docker command to build the image (notice the DOT at the end)
#     docker build -t dulimarta/easelgeo .

FROM node:18-alpine AS build-stage


WORKDIR /app
# Copy from local into the image
COPY package.json yarn.lock ./
RUN yarn install --frozen-lockfile
COPY . .
RUN npx vite build

# node-gyp must be installed globally
# Reference: https://github.com/nodejs/node-gyp/blob/master/docs/Updating-npm-bundled-node-gyp.md

# For NPM 7.x or 8.x

# For older NPM
# RUN npm explore npm/node_modules/npm-lifecycle -g -- npm install node-gyp@latest

# Copy from the host current dir (first arg) into the container current dir (second arg)

# Stage 2: Serve the app
FROM nginx:stable-alpine AS production-stage
COPY default.conf /etc/nginx/conf.d
COPY --from=build-stage /app/dist /usr/share/nginx/html
# Can't export any port on Heroku
EXPOSE 80

# CMD sed -i -e 's/$PORT/'"$PORT"'/g' /etc/nginx/conf.d/default.conf && nginx -g 'daemon off;'
CMD ["nginx", "-g", "daemon off;"]
