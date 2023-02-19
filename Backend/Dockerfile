# Use an official Node.js runtime as a parent image
FROM node:14-alpine

# Set the working directory in the container
WORKDIR /app

# Copy the package.json and package-lock.json files into the container
COPY package*.json ./

# Install the dependencies in the container
RUN npm install

# Copy the rest of the application files into the container
COPY . .

# Expose port 3000 to the host machine
EXPOSE 5000

# Start the application
CMD [ "npm", "run", "start" ]
