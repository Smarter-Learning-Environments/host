FROM node:16

WORKDIR /frontend

COPY . .

RUN npm install

# DEV (WATCH FOR FILE CHANGES)

CMD ["npm", "start"]

# PROD (NO FILE CHANGES)

# CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]