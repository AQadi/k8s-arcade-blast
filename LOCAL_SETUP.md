# Local Offline Setup

This game runs entirely offline in a local container with no external dependencies.

## Architecture

- **Frontend**: React app served by nginx on port 80
- **Game Server**: Local Node.js WebSocket server on port 9999
- **No Cloud Dependencies**: All game logic runs locally

## Quick Start

### Using Docker Compose (Recommended)
```bash
# Build and run the complete stack
docker-compose up --build

# Access the game
open http://localhost:3000
```

### Using Docker Directly
```bash
# Build the image
docker build -t space-invaders .

# Run the container
docker run -p 3000:80 -p 9999:9999 space-invaders

# Access the game
open http://localhost:3000
```

### Local Development
```bash
# Terminal 1: Run game server
cd server
npm install
npm start

# Terminal 2: Run frontend
npm install
npm run dev

# Access at http://localhost:8080
```

## Ports

- `3000` - Frontend (nginx serves React app)
- `9999` - WebSocket game server

## Configuration

The game server URL is configured via:
- Environment variable: `VITE_GAME_SERVER_URL`
- Default: `ws://localhost:9999`

For development, create a `.env.local` file:
```
VITE_GAME_SERVER_URL=ws://localhost:9999
```

## Features

✅ Fully offline - no internet required  
✅ Self-contained Docker image  
✅ Local WebSocket game server  
✅ All assets bundled  
✅ No external API calls  

## Troubleshooting

**Game won't connect:**
- Check if game server is running: `curl http://localhost:9999`
- Check Docker logs: `docker-compose logs -f`
- Verify ports aren't in use: `lsof -i :3000,9999`

**Build fails:**
- Clear Docker cache: `docker-compose build --no-cache`
- Check disk space: `df -h`
