const uuid = require('uuid');

class GameState {
    constructor(){
        this.gameMap = [new Array(3),new Array(3),new Array(3)];
    }
    addMove = (playerTurn, x, y) => {
        this.gameMap[x][y] = playerTurn;
    };
    checkForDraw = () => {
        let isDraw = true;
        for(let x = 0; x < 3;x++){
            for(let y = 0; y < 3;y++){
                if(this.gameMap[x][y] === undefined)
                    isDraw = false;
            }
        }
        return isDraw;
    };
    resetGameMap = () => {
        this.gameMap = [new Array(3),new Array(3),new Array(3)];
    };
    checkForWinner = (playerTurn) => {
        //column row
        for(let i = 0; i < 3; i++){
            let winCondition = [playerTurn];
            for(let j = 0; j < 3; j++){
                if(this.gameMap[i][j] !== playerTurn)
                    winCondition = false;
                else if(winCondition)
                    winCondition.push([i,j]);
            }
            if(winCondition)
                return winCondition;
        }

        //row column
        for(let i = 0; i < 3; i++){
            let winCondition = [playerTurn];
            for(let j = 0; j < 3; j++){
                if(this.gameMap[j][i] !== playerTurn)
                    winCondition = false;
                else if(winCondition)
                    winCondition.push([j,i]);
            }
            if(winCondition)
                return winCondition;
        }

        //diagonal
        let winCondition = [playerTurn];
        for(let i = 0; i < 3; i++){
            if(this.gameMap[i][i] !== playerTurn)
                winCondition = false;
            else if(winCondition)
                winCondition.push([i,i]);
        }
        if(winCondition)
            return winCondition;

        //diagonal reverse
        winCondition = [playerTurn];
        for(let i = 0; i < 3; i++){
            let j = 2 - i;
            if(this.gameMap[i][j] !== playerTurn)
                winCondition = false;
            else if(winCondition)
                winCondition.push([i,j]);
        }
        return winCondition;
    }
}

class Player {
    constructor(id, username, turn){
        this.id = id;
        this.username = username;
        this.turn = turn;
        this.socket = null;
    }
}

//Game status 0 = created game waiting for another player, 1 = active game, 3 done game
class Game {
    constructor(userId, username) {
        const turn = !Math.round(Math.random());
        this.gameId = uuid.v1();
        this.gameState = new GameState();
        this.players = [new Player(userId, username, turn ? 1 : 2), new Player("notConnected","Waiting for opponent", turn ? 2 : 1)];
        this.status = 0;
        this.turn = !Math.round(Math.random()) ? 1 : 2;
    }
    addSecondPlayer = (userId, username) => {
        if(this.players[1].id !== "notConnected")
            return console.log("second user is already in-game");
        this.players[1] = new Player(userId, username, this.players[1].turn);
        this.status = 1;
        return this.gameId;
    };
    getPlayerData = (playerId) => {
        return this.players.map(player => {
            return {name: player.username, isOnline: !!player.socket, turn: player.turn, main: player.id === playerId};
        })
    };
    getGameData = (playerId) => {
        return {state: this.status, gameState: this.gameState.gameMap, turn: this.turn, players: this.getPlayerData(playerId)};
    };
    playMove = (player, x, y) => {
        if(!(/[0-2]/.test(x) && /[0-2]/.test(y)))
            return console.log('invalid data');
        if(this.status !== 1)
            return console.log("game is inactive");
        if(this.gameState.gameMap[x][y] !== undefined)
            return console.log("you cannot play this move");
        if(player.turn === this.turn){
            this.gameState.addMove(player.turn, x, y);
            const winCondition = this.gameState.checkForWinner(this.turn);
            this.turn = this.turn === 1 ? 2 : 1;
            if(winCondition)
                this.endGame(winCondition);
            else{
                const isDraw = this.gameState.checkForDraw();
                if(isDraw)
                    this.gameState.resetGameMap();
            }
            this.sendData(player);
        }
    };
    endGame = (data) => {
        this.winCondition = data;
        this.status = 3;
        console.log(`Game with id:${this.gameId} has ended`);
    };
    sendData = () => {
        this.players.forEach(player => {
            if(player.socket){
                player.socket.emit('gameUpdate', this.getGameData(player.socket.request.session.id));
                if(this.winCondition)
                    player.socket.emit('winCondition', this.winCondition);
            }
        })
    }
}

Game.games = [];
Game.count = 0;

Game.logInUserSocket = (userSocket) => {
    const game = Game.findGameByUserId(userSocket.request.session.id);
    if(!game)
        return false;
    const player = Game.findPlayerByUserId(game, userSocket.request.session.id);
    if(player.socket)
        player.socket.disconnect();
    player.socket = userSocket;
    userSocket.on('disconnect', () => {
        player.socket = null;
        game.sendData();
    });
    userSocket.on('playerMove', ({x,y}) => {
         game.playMove(player,x,y);
    });
    game.sendData();
    return true;
};
Game.add = (userId, username) => {
    const newGame = new Game(userId, username);
    Game.games.push(newGame);
    Game.count++;
    return newGame.gameId;
};
Game.findPlayerByUserId = (game, userId) => {
    let resultPlayer;
    game.players.forEach( player => {
        if(player.id === userId)
            resultPlayer = player;
    });
    return resultPlayer;
};
Game.findGameByUserId = (userId) => {
    let resultGame;
    Game.games.forEach(game => {
        game.players.forEach( player => {
            if(player.id === userId)
                resultGame = game;
        })
    });
    return resultGame;
};
Game.findByGameId = (gameId) => {
    return Game.games.find(game => game.gameId === gameId);
};
Game.removeUser = (userId) => {
    const game = Game.findGameByUserId(userId);
    if(!game)
        return;
    const player = Game.findPlayerByUserId(game, userId);
    if(!player)
        return;
    game.status = 3;
    player.id = "";
    player.socket.disconnect();
};

module.exports = Game;