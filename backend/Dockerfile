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
CMD ["sh", "-c", "echo '>>> Starting prisma db push...' && npx prisma db push 2>&1 && echo '>>> prisma db push OK' && echo '>>> Starting seed...' && node prisma/seed.prod.js && echo '>>> Seed OK' && echo '>>> Starting app...' && node dist/src/main.js"]
