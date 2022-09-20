const express = require('express');
const socketIO = require('socket.io');
const http = require('http')
const bodyParser = require("body-parser");

const port = process.env.PORT || 8080 // setting the port
let app = express();
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
let server = http.createServer(app)
let io = socketIO(server)

const gameCodeSet = new Set();
const gameCodeToStateMap = new Map();
const socketToGameCodeMap = new Map();
const socketToPlayerIdMap = new Map();
const gameCodeToPlayers = new Map();
const gameCodeSocketToTurnMap = new Map();
const GRID_SIZE = 20;
const REQUIRED_CONSECUTIVE_PIECES = 5;

function makeUniqueGameIds(length) {
    var result           = '';
    var characters       = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    var charactersLength = characters.length;
    for ( var i = 0; i < length; i++ ) {
      result += characters.charAt(Math.floor(Math.random() * 
 charactersLength));
   }
   return result;
}

function httpGetAsync(theUrl, callback)
{
    var xmlHttp = new XMLHttpRequest();
    xmlHttp.onreadystatechange = function() { 
        if (xmlHttp.readyState == 4 && xmlHttp.status == 200)
            callback(xmlHttp.responseText);
    }
    xmlHttp.open("GET", theUrl, true); // true for asynchronous 
    xmlHttp.send(null);
}

function createGrid() {
    let grid = [];
    for(let i=0; i<GRID_SIZE; i++) {
        grid.push([]);
        for(let j=0; j<GRID_SIZE; j++) {
            grid[i].push(-1);
        }
    }
    return grid;
}

function checkPieceExists(GRID, x, y) {
    if(GRID[x][y] == -1) {
        return false
    }
    return true;
}

function checkValidTurn(gameState, playerId) {
    return (gameState.turn%2) === playerId;
}

function checkVerticalWin(i, j, GRID) {
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

function checkHorizontalWin(i, j, GRID) {
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

function checkDiagonalWin(i, j, GRID) {
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

function checkReverseDiagonalWin(i, j, GRID) {
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

function checkWinner(GRID) {
    for (let i=0; i < GRID_SIZE; i++) {
        for(let j=0; j < GRID_SIZE; j++) {
            if (checkHorizontalWin(i, j, GRID) || checkVerticalWin(i, j, GRID) || checkDiagonalWin(i, j, GRID) || checkReverseDiagonalWin(i, j, GRID)) {
                return true;
            }
        }
    }
    return false;
}

function getGameStateByGameCode(gameCode) {
    return gameCodeToStateMap.get(gameCode);
}

function validateMove(gameState, playerId, x, y) {
    const GRID = gameState.grid;
    if(!checkValidTurn(gameState, playerId)) {
        return 'Not your turn';
    } else if(checkPieceExists(GRID, x, y)) {
        return 'Piece already exists';
    }
    return 'Move accepted';
}

app.get('/', (req, res) => {
    res.sendFile(__dirname + '/index.html')
})

app.get('/client.css', (req, res) => {
    res.sendFile(__dirname + '/client.css')
})

app.get('/game.js', (req, res) => {
    res.sendFile(__dirname + '/game.js')
})

app.get('/client.js', (req, res) => {
    res.sendFile(__dirname + '/client.js')
})

app.get('/favicon.ico', (req, res) => {
    res.sendFile(__dirname + '/favicon.ico')
})

app.get('/create-game', (req, res) => {
    const gameCode = makeUniqueGameIds(10);
    const grid = createGrid();
    const gameState = {
        grid: grid,
        turn: 0,
        numPlayers: 0,
        players: [],
        nextPlayerTurn: 1,
    };
    gameCodeSet.add(gameCode);
    gameCodeToStateMap.set(gameCode, gameState);
    res.redirect(`/${gameCode}`);
})

app.get('/:gameCode', (req, res) => {
    const gameCode = req.params.gameCode;
    if(gameCodeSet.has(gameCode)) {
        if(gameCodeToPlayers.has(gameCode) && gameCodeToPlayers.get(gameCode).size >= 2) {
            res.send('Game is full');
        } else {
            res.sendFile(__dirname + '/game.html')
        }
    } else {
        res.sendStatus(404);
    }
})

app.get('/get-game-state/:gameCode', (req, res) => {
    const gameCode = req.params.gameCode;
    if(gameCodeSet.has(gameCode)) {
        const gameState = getGameStateByGameCode(gameCode);
        res.send({ 
            grid: gameState.grid,
            turn: gameState.turn,
        });
    } else {
        res.sendStatus(404);
    }
});

app.get('/join-game', (req, res) => {})

server.listen(port, () => {
    console.log(`Server is up on port ${port}`)
})

io.on('connection', (socket) => {
    console.log('New user connected', socket.id)

    socket.on('disconnect', () => {
        console.log('User was disconnected', socket.id)
    })

    socket.on('move', (data) => {
        const x = data.x;
        const y = data.y;
        const gameCode = data.gameCode;
        const playerId = data.playerId;
        const gameState = getGameStateByGameCode(gameCode);
        const currentTurn = gameState.turn;
        const validation = validateMove(gameState, playerId, x, y);
        if (validation !== 'Move accepted') {
            io.to(socket.id).emit('move-ack', {x: data.x, y: data.y, status: 'failure', msg: validation});
        } else {
            gameState.grid[x][y] = playerId;
            gameState.turn++;
            gameState.nextPlayerTurn = (gameState.nextPlayerTurn + 1) % 2;
            io.emit('move-ack', { x: data.x, y: data.y, turn: currentTurn, status: 'success', msg: 'Move accepted'});
            if(checkWinner(gameState.grid)) {
                io.emit('winner', { winner: playerId });
            }
        }
    })

    socket.on('initialize', (data) => {
        if (socketToGameCodeMap.has(socket.id)) {
            const gameCodes = socketToGameCodeMap.get(socket.id);
            if (gameCodes.has(data.gameCode)) {
                return;
            } else {
                gameCodes.add(data.gameCode);
            }
        } else {
            const gameCodes = new Set();
            gameCodes.add(data.gameCode);
            socketToGameCodeMap.set(socket.id, gameCodes);
        }
        if (gameCodeToPlayers.has(data.gameCode)) {
            const players = gameCodeToPlayers.get(data.gameCode);
            players.add(socket.id);
            gameCodeSocketToTurnMap.set({gameCode: data.gameCode, socket: socket.id}, players.size - 1);
        } else {
            const players = new Set();
            players.add(socket.id);
            gameCodeSocketToTurnMap.set({gameCode: data.gameCode, socket: socket.id}, players.size - 1);
            gameCodeToPlayers.set(data.gameCode, players);
        }
        if(gameCodeToStateMap.has(data.gameCode)) {
            const gameState = getGameStateByGameCode(data.gameCode);
            gameState.numPlayers++;
            gameState.players.push(socket.id);
            io.to(socket.id).emit('initialize', {playerId: gameState.numPlayers - 1, turn: gameState.turn, socketID: socket.id});
        }
    })
})
