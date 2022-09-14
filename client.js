const host = window.location.host;

function createGame() {
    window.location.replace(`http://${host}/create-game`);
}

function joinGame() {
    const gameCode = document.getElementById('game-code').value;
    window.location.replace(`http://${host}/${gameCode}`);
}

window.onload = function() {
    const createGameButton = document.getElementById('create-game');
    createGameButton.addEventListener('click', createGame, false);
    const joinGameButton = document.getElementById('join-game');
    joinGameButton.addEventListener('click', joinGame, false);
}
