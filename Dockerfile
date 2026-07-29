FROM node:18

RUN apt-get update && apt-get install -y lua5.1 luac

WORKDIR /app
COPY . .
RUN npm install

EXPOSE 3000
CMD ["node", "server.js"]
