const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

// Serve static files
app.use(express.static('./'));

// Store active rooms
const rooms = new Map();

// Generate random room code
function generateRoomCode() {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
}

// Get random text for typing
function getRandomText() {
    const texts = [
        "The quick brown fox jumps over the lazy dog.",
        "To be or not to be, that is the question.",
        "All that glitters is not gold.",
        "Practice makes perfect.",
        "Actions speak louder than words."
    ];
    return texts[Math.floor(Math.random() * texts.length)];
}

// Socket.IO connection handling
io.on('connection', (socket) => {
    console.log('User connected:', socket.id);

    // Create room
    socket.on('create-room', ({ playerName }) => {
        const roomCode = generateRoomCode();
        rooms.set(roomCode, {
            players: [{
                id: socket.id,
                name: playerName,
                progress: 0,
                wpm: 0,
                ready: false
            }],
            inProgress: false
        });

        socket.join(roomCode);
        socket.emit('room-created', { roomCode });
    });

    // Join room
    socket.on('join-room', ({ roomCode, playerName }) => {
        const room = rooms.get(roomCode);
        
        if (room && !room.inProgress) {
            room.players.push({
                id: socket.id,
                name: playerName,
                progress: 0,
                wpm: 0,
                ready: false
            });

            socket.join(roomCode);
            socket.emit('room-joined', { roomCode });
            io.to(roomCode).emit('player-joined', { players: room.players });
        }
    });

    // Player ready
    socket.on('player-ready', ({ ready }) => {
        let playerRoom = null;
        let room = null;

        for (const [roomCode, roomData] of rooms) {
            const playerIndex = roomData.players.findIndex(p => p.id === socket.id);
            if (playerIndex !== -1) {
                playerRoom = roomCode;
                room = roomData;
                room.players[playerIndex].ready = ready;
                break;
            }
        }

        if (room && playerRoom) {
            const allReady = room.players.every(p => p.ready);
            
            if (allReady && room.players.length >= 1) {
                room.inProgress = true;
                io.to(playerRoom).emit('game-start', {
                    text: getRandomText()
                });
            }
        }
    });

    // Progress update
    socket.on('progress-update', ({ progress, wpm }) => {
        for (const [roomCode, room] of rooms) {
            const playerIndex = room.players.findIndex(p => p.id === socket.id);
            if (playerIndex !== -1) {
                room.players[playerIndex].progress = progress;
                room.players[playerIndex].wpm = wpm;
                io.to(roomCode).emit('player-progress', {
                    playerId: socket.id,
                    progress,
                    wpm
                });
                break;
            }
        }
    });

    // Disconnect handling
    socket.on('disconnect', () => {
        for (const [roomCode, room] of rooms) {
            const playerIndex = room.players.findIndex(p => p.id === socket.id);
            if (playerIndex !== -1) {
                room.players.splice(playerIndex, 1);
                
                if (room.players.length === 0) {
                    rooms.delete(roomCode);
                } else {
                    io.to(roomCode).emit('player-left', { players: room.players });
                }
                break;
            }
        }
    });
});

// Start server
const PORT = process.env.PORT || 3000;
http.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
}); 