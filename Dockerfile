FROM node:22

RUN apt-get update && apt-get install -y \
    python3 make g++ \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package*.json ./

RUN mkdir -p data
RUN mkdir -p uploads

RUN rm -rf node_modules
RUN npm install --build-from-source @tensorflow/tfjs-node
RUN npm install

COPY . .

CMD ["npm", "run", "start"]
