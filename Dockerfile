FROM node:16.3.0-alpine

# Here you should set your ENV variables
ENV TEXT="Thank you for using my template <3 -Pol"

WORKDIR /app

COPY package.json .

RUN npm i

ADD src/ ./src
ADD tsconfig.json ./

RUN npm run tsc

CMD [ "npm", "run", "start_lite" ]