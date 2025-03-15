// Connect to the Socket.IO server
const socket = io(window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    ? 'http://localhost:3000'
    : window.location.origin, {
        path: '/socket.io'
    });

// DOM Elements
const createRoomBtn = document.getElementById('create-room');
const joinRoomBtn = document.getElementById('join-room');
const createModal = document.getElementById('create-modal');
const joinModal = document.getElementById('join-modal');
const modalOverlay = document.querySelector('.modal-overlay');
const readyBtn = document.getElementById('ready-btn');

// Game state
let currentRoom = null;
let playerName = '';
let players = new Map();
let isReady = false;

// Modal handling
if (createRoomBtn) {
    createRoomBtn.addEventListener('click', () => {
        createModal.classList.add('active');
        modalOverlay.classList.add('active');
    });
}

if (joinRoomBtn) {
    joinRoomBtn.addEventListener('click', () => {
        joinModal.classList.add('active');
        modalOverlay.classList.add('active');
    });
}

// Room creation
document.getElementById('create-submit')?.addEventListener('click', () => {
    const nameInput = document.getElementById('create-name-input');
    if (nameInput.value.trim()) {
        playerName = nameInput.value.trim();
        socket.emit('create-room', { playerName });
    }
});

// Room joining
document.getElementById('join-submit')?.addEventListener('click', () => {
    const codeInput = document.getElementById('room-code-input');
    const nameInput = document.getElementById('player-name-input');
    if (codeInput.value.trim() && nameInput.value.trim()) {
        playerName = nameInput.value.trim();
        socket.emit('join-room', {
            roomCode: codeInput.value.trim(),
            playerName
        });
    }
});

// Ready state handling
if (readyBtn) {
    readyBtn.addEventListener('click', () => {
        isReady = !isReady;
        readyBtn.textContent = isReady ? 'Waiting...' : 'Ready';
        readyBtn.classList.toggle('active');
        socket.emit('player-ready', { ready: isReady });
    });
}

// Socket event handlers
socket.on('room-created', ({ roomCode }) => {
    currentRoom = roomCode;
    window.location.href = `game.html?room=${roomCode}&player=${playerName}`;
});

socket.on('room-joined', ({ roomCode }) => {
    currentRoom = roomCode;
    window.location.href = `game.html?room=${roomCode}&player=${playerName}`;
});

socket.on('player-joined', ({ players: roomPlayers }) => {
    updatePlayersList(roomPlayers);
});

socket.on('player-left', ({ players: roomPlayers }) => {
    updatePlayersList(roomPlayers);
});

socket.on('game-start', ({ text }) => {
    if (textDisplay) {
        textDisplay.textContent = text;
        inputField.disabled = false;
        inputField.placeholder = 'Start typing here...';
        startGame();
    }
});

socket.on('player-progress', ({ playerId, progress, wpm }) => {
    updatePlayerProgress(playerId, progress, wpm);
});

// Game initialization
function initializeGame() {
    const urlParams = new URLSearchParams(window.location.search);
    const roomCode = urlParams.get('room');
    const player = urlParams.get('player');

    if (roomCode && player) {
        currentRoom = roomCode;
        playerName = player;
        document.getElementById('room-code').textContent = `Room: ${roomCode}`;
        socket.emit('join-room', { roomCode, playerName });
    }
}

// Update players list
function updatePlayersList(roomPlayers) {
    const container = document.getElementById('players-container');
    if (!container) return;

    container.innerHTML = '';
    roomPlayers.forEach(player => {
        const playerCard = document.createElement('div');
        playerCard.className = 'player-card';
        playerCard.innerHTML = `
            <div class="player-name">${player.name}</div>
            <div class="player-progress">
                <div class="progress-bar" style="width: ${player.progress}%"></div>
            </div>
            <div class="player-wpm">WPM: ${player.wpm || 0}</div>
        `;
        container.appendChild(playerCard);
    });
}

// Update player progress
function updatePlayerProgress(playerId, progress, wpm) {
    const playerCard = document.querySelector(`[data-player-id="${playerId}"]`);
    if (playerCard) {
        playerCard.querySelector('.progress-bar').style.width = `${progress}%`;
        playerCard.querySelector('.player-wpm').textContent = `WPM: ${wpm}`;
    }
}

// Modified checkInput function
const originalCheckInput = window.checkInput;
if (typeof originalCheckInput === 'function') {
    window.checkInput = function() {
        originalCheckInput();
        
        if (currentRoom) {
            const progress = (inputField.value.length / textDisplay.textContent.length) * 100;
            socket.emit('progress-update', {
                progress,
                wpm: parseInt(wpmDisplay.textContent)
            });
        }
    };
}

// Initialize game if on game page
if (window.location.pathname.includes('game.html')) {
    initializeGame();
} 