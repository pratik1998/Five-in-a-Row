function createGame() {
    console.log('Game created');
    window.location.replace("http://localhost:8080/create-game");
}

function joinGame() {
    console.log('Game joined');
    const gameCode = document.getElementById('game-code').value;
    console.log('Game code: ' + gameCode);
    window.location.replace("http://localhost:8080/" + gameCode);
}

window.onload = function() {
    const createGameButton = document.getElementById('create-game');
    createGameButton.addEventListener('click', createGame, false);
    const joinGameButton = document.getElementById('join-game');
    joinGameButton.addEventListener('click', joinGame, false);
}
