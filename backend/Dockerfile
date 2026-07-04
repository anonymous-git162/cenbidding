FROM node:22-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY prisma ./prisma
RUN npx prisma generate
COPY . .
RUN npm run build

FROM node:22-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev
COPY --from=build /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=build /app/dist ./dist
COPY --from=build /app/prisma ./prisma
EXPOSE 3000
# ponytail: db push instead of migrate deploy — more reliable when migration state gets out of sync (Render free tier DB resets)
CMD ["sh", "-c", "npx prisma db push 2>&1 && node prisma/seed.prod.js && node dist/src/main.js"]
