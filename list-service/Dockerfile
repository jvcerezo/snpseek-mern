# Use official Node.js image
FROM node:18

# Set the working directory inside the container
WORKDIR /app

# Copy package.json and install dependencies
COPY package.json package-lock.json ./
RUN npm install

# Copy all other files
COPY . .

# Expose the correct port
EXPOSE 5003

# Start the service
CMD ["node", "server.js"]
