# Nexus Protocol - AAA Project

A Node.js server project for the Nexus Protocol system.

## Features

- Express.js web server
- Socket.IO real-time communication
- CORS enabled
- RESTful API endpoints
- WebSocket support

## Installation

```bash
npm install
```

## Usage

### Development
```bash
npm run dev
```

### Production
```bash
npm start
```

## API Endpoints

- `GET /` - Server status and welcome message
- `GET /api/status` - Detailed server information

## WebSocket Events

- `connection` - Client connects
- `disconnect` - Client disconnects  
- `ping/pong` - Heartbeat mechanism

## Scripts

- `npm start` - Start production server
- `npm run dev` - Start development server with nodemon
- `npm run build` - Build for production
- `npm test` - Run tests

## Dependencies

- express: Web framework
- socket.io: Real-time communication
- cors: Cross-origin resource sharing

## Dev Dependencies

- nodemon: Development server with auto-restart
- webpack: Module bundler
- jest: Testing framework