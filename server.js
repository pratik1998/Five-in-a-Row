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

function getGameStateByGameCode(gameCode) {
    return gameCodeToStateMap.get(gameCode);
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
    const gameCode = makeUniqueGameIds(5);
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

app.post('/get-game-state', (req, res) => {
    const gameCode = req.body.gameCode;
    if(gameCodeSet.has(gameCode)) {
        const gameState = getGameStateByGameCode(gameCode);
        console.log('Game state: ' + gameState);
        res.send(gameState.grid);
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
        console.log(data)
        console.log('Game code: ' + data.gameCode);
        const gameState = getGameStateByGameCode(data.gameCode);
        console.log('Game state: ' + gameState);
        gameState.grid[data.x][data.y] = data.playerId;
        socket.broadcast.emit('move', {x: data.x, y: data.y});
    })

    socket.on('initialize', (data) => {
        console.log('Initializing game', data);
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
            // socket.broadcast.emit('initialize', {playerId: gameState.numPlayers - 1});
        }
        console.log(data);
        console.log(socketToGameCodeMap);
    })
})