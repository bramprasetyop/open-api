# Use Node.js 18.18.0 with Alpine Linux as the base image
FROM node:18.18.0-alpine

ENV NODE_TLS_REJECT_UNAUTHORIZED=0

RUN apk add --no-cache bash git sudo

# Set the working directory within the container
WORKDIR /app

# Copy package.json and package-lock.json to the container
COPY package*.json ./

# Set TZ to UTC+7 Asia/Jakarta
ENV TZ=Asia/Jakarta

RUN npm config set "strict-ssl" false -g

RUN npm install node-pre-gyp -g

# Install application dependencies
RUN npm install yarn

# Install application dependencies
RUN yarn install

# Build arguments for username and password gitsource repo
ARG USERNAME=
ARG PASSWORD=
# env option is sit, uat or prod
ARG ENVIRONMENT=

# Git clone, copy .env, and remove unnecessary files
RUN sudo git clone -b external/be-eli-open-api https://${USERNAME}:${PASSWORD}@gitsource.myequity.id/MKO/test-folder-deploy.git \
  && sudo cp -r test-folder-deploy/eli-open-api/.env.${ENVIRONMENT} .env \
  && sudo rm -rf test-folder-deploy

# Copy the application source code to the container
COPY . .

# Build the application (if needed)
RUN yarn run build

# Specify the command to run the application in production mode
CMD [ "node", "dist/main.js" ]
