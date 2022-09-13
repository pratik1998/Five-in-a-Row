import { io } from "https://cdn.socket.io/4.4.1/socket.io.esm.min.js";
const socket = io("http://localhost:8080");

const BOARD_WIDTH = 700;
const BOARD_HEIGHT = 700;
const GRID_SIZE = 20;
const GRID = []
const HORIZONTAL_STEP_SIZE = BOARD_WIDTH/GRID_SIZE;
const VERTICAL_STEP_SIZE = BOARD_HEIGHT/GRID_SIZE;
const REQUIRED_CONSECUTIVE_PIECES = 5;

var turn = 0;
var piecesPositions = [];

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
    if(GRID[x][y] == -1) {
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

function updateGrid(x, y, emit = false) {
    let gridApproxPosition = getGridIntersection(y, x);
    if (!checkPieceExists(x, y)) {
        const canvas = document.getElementById('board');
        const ctx = canvas.getContext('2d');
        ctx.beginPath();
        ctx.arc(gridApproxPosition[0], gridApproxPosition[1], HORIZONTAL_STEP_SIZE/2, 0, 2 * Math.PI, false);
        ctx.fillStyle = turn % 2 === 0 ? 'black' : 'white';
        ctx.fill();
        GRID[x][y] = turn % 2;
        if(emit)
            socket.emit('move', {x: x, y: y, turn: turn});
        if(checkWinner()) {
            alert('Player with ' + (turn % 2 === 0 ? 'black' : 'white') + ' pieces wins!');
        }
        turn++;
        const playerInfo = document.getElementById('player-info');
        playerInfo.innerHTML = 'Player with ' + (turn % 2 === 0 ? 'black' : 'white') + ' pieces turn';
        
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
    updateGrid(approximatePosition[1], approximatePosition[0], true);
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
    canvas.addEventListener('click', addPiece, false);
}

window.onload = function() {
    initializeBoard();
}

socket.on('move', function(data) {
    updateGrid(data.x, data.y);
});