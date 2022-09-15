import { io } from "https://cdn.socket.io/4.4.1/socket.io.esm.min.js";
const host = window.location.host;
const socket = io(`http://${host}`);

const BOARD_WIDTH = 700;
const BOARD_HEIGHT = 700;
const GRID_SIZE = 20;
let GRID = []
const HORIZONTAL_STEP_SIZE = BOARD_WIDTH/GRID_SIZE;
const VERTICAL_STEP_SIZE = BOARD_HEIGHT/GRID_SIZE;
const REQUIRED_CONSECUTIVE_PIECES = 5;

var playerId = -1;

function getApproximatePosition(x, y) {
    const HORIZONTAL_STEP_SIZE = BOARD_WIDTH/(GRID_SIZE * 2);
    const VERTICAL_STEP_SIZE = BOARD_HEIGHT/(GRID_SIZE * 2);
    let x_pos = Math.ceil(Math.floor(x/HORIZONTAL_STEP_SIZE)/2);
    let y_pos = Math.ceil(Math.floor(y/VERTICAL_STEP_SIZE)/2);
    // Handle the case where the x position or y position is 0
    x_pos = x_pos <= 0 ? 1 : x_pos;
    y_pos = y_pos <= 0 ? 1 : y_pos;
    x_pos = x_pos >= GRID_SIZE ? GRID_SIZE - 1 : x_pos;
    y_pos = y_pos >= GRID_SIZE ? GRID_SIZE - 1 : y_pos;
    return [x_pos, y_pos];
}

function getGridIntersection(x, y) {
    return [x * HORIZONTAL_STEP_SIZE, y * VERTICAL_STEP_SIZE];
}

function checkPieceExists(x, y) {
    if(GRID[x][y] === -1) {
        return false
    }
    return true;
}

function checkVerticalWin(i, j) {
    if (i < 0 || i + REQUIRED_CONSECUTIVE_PIECES - 1 >= GRID_SIZE || j < 0 || j >= GRID_SIZE) {
        return false;
    }
    if(GRID[i][j] === -1)
        return false;
    for(let k=i; k < i + REQUIRED_CONSECUTIVE_PIECES; k++) {
        if (GRID[k][j] !== GRID[i][j])
            return false;
    }
    return true;
}

function checkHorizontalWin(i, j) {
    if (i < 0 || i >= GRID_SIZE || j < 0 || j + REQUIRED_CONSECUTIVE_PIECES - 1 >= GRID_SIZE) {
        return false;
    }
    if(GRID[i][j] === -1)
        return false;
    for(let k=j; k < j + REQUIRED_CONSECUTIVE_PIECES; k++) {
        if (GRID[i][k] !== GRID[i][j])
            return false
    }
    return true;
}

function checkDiagonalWin(i, j) {
    if (i < 0 || i + REQUIRED_CONSECUTIVE_PIECES - 1 >= GRID_SIZE || j < 0 || j + REQUIRED_CONSECUTIVE_PIECES - 1 >= GRID_SIZE) {
        return false;
    }
    if(GRID[i][j] === -1)
        return false;
    for(let k=0; k < REQUIRED_CONSECUTIVE_PIECES; k++) {
        if (GRID[i+k][j+k] !== GRID[i][j])
            return false
    }
    return true;
}

function checkReverseDiagonalWin(i, j) {
    if (i < REQUIRED_CONSECUTIVE_PIECES - 1 || i >= GRID_SIZE || j < 0 || j + REQUIRED_CONSECUTIVE_PIECES - 1 >= GRID_SIZE) {
        return false;
    }
    if(GRID[i][j] === -1)
        return false;
    for(let k=0; k < REQUIRED_CONSECUTIVE_PIECES; k++) {
        if (GRID[i-k][j+k] !== GRID[i][j])
            return false
    }
    return true;
}

function checkWinner() {
    // Turn is incremented after every move. Initially turn is 0.
    if(turn < 8) {
        return false
    }
    for (let i=0; i < GRID_SIZE; i++) {
        for(let j=0; j < GRID_SIZE; j++) {
            if (checkHorizontalWin(i, j) || checkVerticalWin(i, j) || checkDiagonalWin(i, j) || checkReverseDiagonalWin(i, j)) {
                return true;
            }
        }
    }
    return false;
}

function updateTurnInfo(turn) {
    const playerInfo = document.getElementById('turn');
    playerInfo.innerHTML = `Current Turn: ${turn % 2 === playerId ? 'Your' : 'Opponent'}'s`;
}

function updateGrid(x, y, turn, forceUpdate=false) {
    let gridApproxPosition = getGridIntersection(y, x);
    if (forceUpdate || !checkPieceExists(x, y)) {
        const canvas = document.getElementById('board');
        const ctx = canvas.getContext('2d');
        ctx.beginPath();
        ctx.arc(gridApproxPosition[0], gridApproxPosition[1], (HORIZONTAL_STEP_SIZE/2) * 0.7, 0, 2 * Math.PI, false);
        ctx.fillStyle = turn % 2 === 0 ? 'black' : 'white';
        ctx.fill();
        GRID[x][y] = turn % 2;
        turn++;
        updateTurnInfo(turn);
    } else {
        alert('Piece already exists at this position.\nPlesae choose another position.');
    }
}

function addPiece(event) {
    const canvas = document.getElementById('board');
    const canvasTop = canvas.offsetTop;
    const canvasLeft = canvas.offsetLeft;
    const x = event.pageX - canvasLeft;
    const y = event.pageY - canvasTop;
    let approximatePosition = getApproximatePosition(x, y);
    const gameCode = getGameCodeFromURL();
    socket.emit('move', {x: approximatePosition[1], y: approximatePosition[0], gameCode, playerId: playerId});
}

function initializeGrid() {
    for(let i=0; i < GRID_SIZE; i++) {
        for(let j=0; j < GRID_SIZE; j++) {
            if(GRID[i][j] !== -1) {
                updateGrid(i, j, GRID[i][j], true);
            }
        }
    }
}

function getGameCodeFromURL() {
    const url = window.location.pathname;
    const gameCode = url.split('/')[1];
    return gameCode;
}

function initializeBoard() {
    const canvas = document.getElementById('board');
    const ctx = canvas.getContext('2d');
    const padding = 0;

    const HORIZONTAL_STEP_SIZE = BOARD_WIDTH/GRID_SIZE;
    const VERTICAL_STEP_SIZE = BOARD_HEIGHT/GRID_SIZE;
    for (let x = HORIZONTAL_STEP_SIZE; x <= BOARD_WIDTH; x += HORIZONTAL_STEP_SIZE) {
        ctx.moveTo(0.5 + x + padding, padding);
        ctx.lineTo(0.5 + x + padding, BOARD_HEIGHT + padding);
    }

    for (let x = VERTICAL_STEP_SIZE; x <= BOARD_HEIGHT; x += VERTICAL_STEP_SIZE) {
        ctx.moveTo(padding, 0.5 + x + padding);
        ctx.lineTo(BOARD_WIDTH + padding, 0.5 + x + padding);
    }

    for(let i=0; i<GRID_SIZE; i++) {
        GRID.push([]);
        for(let j=0; j<GRID_SIZE; j++) {
            GRID[i].push(-1);
        }
    }

    ctx.strokeStyle = "black";
    ctx.stroke();

    const gameCode = getGameCodeFromURL();
    socket.emit('initialize', {gameCode: gameCode});
    const xhr = new XMLHttpRequest();
    xhr.open("GET", `http://${host}/get-game-state/${gameCode}`, false);
    xhr.setRequestHeader('Content-Type', 'application/json');
    xhr.send();

    if (xhr.status === 200) {
        const response = JSON.parse(xhr.responseText);
        GRID = response.grid;
        turn = response.turn;
    }

    initializeGrid();
    canvas.addEventListener('click', addPiece, false);
    const gameCodeElement = document.getElementById('game-code');
    gameCodeElement.innerHTML = 'Secret Code: ' + gameCode;
}

window.onload = function() {
    initializeBoard();
}

socket.on('move', function(data) {
    updateGrid(data.x, data.y, data.turn);
});

socket.on('initialize', function(data) {
    playerId = data.playerId;
    const turn = data.turn;
    const pieceInfo = document.getElementById('piece-info');
    pieceInfo.innerHTML = 'Your Pieces: ' + (playerId % 2 === 0 ? 'Black' : 'White');
    updateTurnInfo(turn);
});

socket.on('move-ack', function(data) {
    const status = data.status;
    if(status === 'success') {
        updateGrid(data.x, data.y, data.turn);
    } else if(status === 'failure') {
        const msg = data.msg;
        alert(msg);
    }
});

socket.on('winner', function(data) {
    alert('Player with ' + (data.winner % 2 === 0 ? 'black' : 'white') + ' pieces won!');
});