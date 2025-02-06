FROM node:20-alpine AS development

WORKDIR /usr/src/app

COPY package*.json ./

RUN npm install --no-fund --no-audit --legacy-peer-deps

COPY . .

RUN npm run build

FROM node:20-alpine AS production

ARG NODE_ENV=production
ENV NODE_ENV=${NODE_ENV}

WORKDIR /usr/src/app

COPY package*.json ./

RUN npm install --omit=dev --no-fund --no-audit --legacy-peer-deps

COPY . .

COPY --from=development /usr/src/app/dist ./dist 

CMD ["node", "dist/main"]