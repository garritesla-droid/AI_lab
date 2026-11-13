FROM node:22-alpine
WORKDIR /app
COPY . .
USER node
ENV PORT=8765
EXPOSE 8765
CMD ["node", "service/server.mjs"]
