const express = require('express');
const socketIO = require('socket.io');
const http = require('http')

const port = process.env.PORT || 8080 // setting the port
let app = express();
let server = http.createServer(app)
let io = socketIO(server)

app.get('/', (req, res) => {
    res.sendFile(__dirname + '/index.html')
})

app.get('/client.css', (req, res) => {
    res.sendFile(__dirname + '/client.css')
})

app.get('/client.js', (req, res) => {
    res.sendFile(__dirname + '/client.js')
})

app.get('/favicon.ico', (req, res) => {
    res.sendFile(__dirname + '/favicon.ico')
})

server.listen(port, () => {
    console.log(`Server is up on port ${port}`)
})

io.on('connection', (socket) => {
    console.log('New user connected', socket.id)

    socket.on('disconnect', () => {
        console.log('User was disconnected', socket.id)
    })

    socket.on('move', (data) => {
        socket.broadcast.emit('move', data);
    })
})