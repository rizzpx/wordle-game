const loginPage = document.getElementById('login-page');
const gamePage = document.getElementById('game-page');
const loginForm = document.getElementById('login-form');
const loginError = document.getElementById('login-error');
const board = document.getElementById('board');
const keyboard = document.getElementById('keyboard');
const gameMessage = document.getElementById('game-message');

let wordToGuess = '';
let currentRow = 0;
let currentGuess = '';
let guesses = Array(6).fill('').map(() => Array(5).fill('')); 

// Fetch random word w specific length
async function fetchWordWithLength(length) {
    try {
        let word = '';
        do {
            const response = await fetch('https://delta-indie.vercel.app/api/random-word', {headers: {Authorization:'Bearer ' + localStorage.getItem('token')}});
            const data = await response.json();
            word = data.word.toUpperCase();
            console.log(word); 
        } while (!word || word.length !== length); 
        return word;
    } catch (error) {
        console.error('Error fetching the word:', error);
        gameMessage.textContent = 'Failed to fetch a valid word. Please try again later.';
        return '';
    }
}

// Fetch word when the game starts
async function fetchWord() {
    wordToGuess = await fetchWordWithLength(5);
    if (!wordToGuess) {
        gameMessage.textContent = 'Unable to start the game due to word fetching error.';
    } else {
        console.log(`Word to guess: ${wordToGuess}`); 
    }
}

// Initialize game board
function initializeBoard() {
    board.innerHTML = '';
    for (let i = 0; i < 30; i++) {
        const cell = document.createElement('div'); 
        cell.classList.add('cell');
        board.appendChild(cell); 
    }
}

// Handle key presses
keyboard.addEventListener('click', (e) => {
    const key = e.target;
    if (!key.classList.contains('key')) return;

    const action = key.dataset.action;
    if (action === 'enter') {
        submitGuess();
    } else if (action === 'delete') {
        deleteLetter();
    } else {
        addLetter(key.textContent);
    }
});

function addLetter(letter) {
    if (currentGuess.length < 5) {
        guesses[currentRow][currentGuess.length] = letter;
        updateBoard();
        currentGuess += letter;
    }
}

function deleteLetter() {
    if (currentGuess.length > 0) {
        guesses[currentRow][currentGuess.length - 1] = '';
        updateBoard();
        currentGuess = currentGuess.slice(0, -1);
    }
}

function submitGuess() {
    if (currentGuess.length !== 5) {
        gameMessage.textContent = 'Guess must be 5 letters long!';
        return;
    }

    const guess = currentGuess.split(''); 
    const target = wordToGuess.split('');

    const targetFrequency = {};
    target.forEach(letter => {
        targetFrequency[letter] = (targetFrequency[letter] || 0) + 1;
    });

    const result = Array(5).fill('wrong');
     
    guess.forEach((letter, index) => {
        if (letter === target[index]) {
            result[index] = 'correct'; 
            targetFrequency[letter]--;
        }
    });

    guess.forEach((letter, index) => {
        if (result[index] === 'wrong' && targetFrequency[letter] > 0) {
            result[index] = 'partial'; 
            targetFrequency[letter]--; 
        }
    });

    for (let i = 0; i < 5; i++) {
        const cellIndex = currentRow * 5 + i;
        const cell = board.children[cellIndex];
        cell.textContent = guess[i];
        cell.classList.add(result[i]);
    }
    
    if (currentGuess === wordToGuess) {
        gameMessage.textContent = 'You guessed the word!';
        return;
    }

    currentRow++;
    currentGuess = '';

    if (currentRow === 6) {
        gameMessage.textContent = `Game over! The word was ${wordToGuess}.`;
    }
}
            
function updateBoard() {
    for (let row = 0; row <= currentRow; row++) {
        for (let col = 0; col < 5; col++) {
            const cellIndex = row * 5 + col;
            const cell = board.children[cellIndex];
            cell.textContent = guesses[row][col];
        }
    }
}

// Login form submission
loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;

    try {
        const response = await fetch('https://delta-indie.vercel.app/api/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password }),
        });
        const data = await response.json();
        console.log(data);
        if (data.token) {
            localStorage.setItem('token', data.token);
            loginPage.classList.add('hidden'); 
            loginPage.remove(); 
            gamePage.classList.remove('hidden'); 
            await fetchWord();
            initializeBoard();
        } else {
            const errorData = await response.json();
            loginError.textContent = errorData.message || 'Invalid login.';
        }
    } catch (error) {
        loginError.textContent = 'An error occurred. Please try again.';
    }
});
