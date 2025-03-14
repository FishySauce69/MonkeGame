// DOM Elements
const textDisplay = document.getElementById('text-display');
const inputField = document.getElementById('input-field');
const wpmDisplay = document.getElementById('wpm');
const accuracyDisplay = document.getElementById('accuracy');
const timeDisplay = document.getElementById('time');
const restartBtn = document.getElementById('restart-btn');

// Game variables
let timeLeft = 60;
let timer = null;
let isGameActive = false;
let totalCharacters = 0;
let correctCharacters = 0;

// Sample texts for typing
const sampleTexts = [
    "The quick brown fox jumps over the lazy dog.",
    "To be or not to be, that is the question.",
    "All that glitters is not gold.",
    "Practice makes perfect.",
    "Actions speak louder than words."
];

// Game functions
function getRandomText() {
    return sampleTexts[Math.floor(Math.random() * sampleTexts.length)];
}

function updateStats() {
    const timePassed = 60 - timeLeft;
    const wpm = Math.round((correctCharacters / 5) * (60 / Math.max(1, timePassed)));
    const accuracy = Math.round((correctCharacters / Math.max(1, totalCharacters)) * 100);
    
    wpmDisplay.textContent = wpm;
    accuracyDisplay.textContent = accuracy + '%';
}

function startGame() {
    if (isGameActive) return;
    
    isGameActive = true;
    timeLeft = 60;
    totalCharacters = 0;
    correctCharacters = 0;
    
    textDisplay.textContent = getRandomText();
    inputField.value = '';
    inputField.disabled = false;
    inputField.focus();
    
    timer = setInterval(() => {
        timeLeft--;
        timeDisplay.textContent = timeLeft;
        
        if (timeLeft <= 0) {
            endGame();
        }
    }, 1000);
}

function endGame() {
    clearInterval(timer);
    isGameActive = false;
    inputField.disabled = true;
    updateStats();
}

function checkInput() {
    const expectedText = textDisplay.textContent;
    const currentInput = inputField.value;
    totalCharacters = currentInput.length;
    
    correctCharacters = 0;
    for (let i = 0; i < currentInput.length; i++) {
        if (currentInput[i] === expectedText[i]) {
            correctCharacters++;
        }
    }
    
    updateStats();
    
    if (currentInput === expectedText) {
        textDisplay.textContent = getRandomText();
        inputField.value = '';
    }
}

// Event listeners
inputField.addEventListener('input', checkInput);
inputField.addEventListener('focus', startGame);
restartBtn.addEventListener('click', () => {
    clearInterval(timer);
    startGame();
}); 