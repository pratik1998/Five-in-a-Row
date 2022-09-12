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

app.listen(port, () => {
    console.log(`Server is up on port ${port}`)
})