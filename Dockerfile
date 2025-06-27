FROM node:20

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

# ✅ generate Prisma client
# Run Prisma schema sync during build/start
RUN npx prisma generate
RUN npm install -g nodemon

# Optional: If you want it on build
# RUN npx prisma db push

EXPOSE 3000

CMD ["npm", "run", "dev"]
