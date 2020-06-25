const express = require('express');
const http = require('http');
const path = require('path');
const session = require('express-session');
const bodyParser = require('body-parser');
const socket = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = socket(server);

const Game = require('./Game');

const sessionMiddleware = session({
    key: '_sid',
    secret: 'secret1234321',
    resave: true,
    saveUninitialized: true,
});

app.use(sessionMiddleware);
app.use(express.static(path.join(__dirname, '..', 'client', 'build')));
app.use(bodyParser.urlencoded({extended:true}));
app.use(bodyParser.json());

app.get('/api/username', (req, res) => {
    res.send({username: req.session.username || ""});
});


app.post('/api/leave',(req,res) => {
    if(!req.session)
        return res.send({error:"Cannot find session id, restart page"});
    Game.removeUser(req.session.id);
    res.send({message:"successfully removed player from the game"});
});
app.post('/api/rejoin',(req,res) => {
    if(!req.session)
        return res.send({error:"Cannot find session id, restart page"});
    const activeGame = Game.findGameByUserId(req.session.id);
    if(!activeGame)
        return res.send({error:"No active game found"});
    res.send({gameid: activeGame.gameId});
});

app.post('/api/create', (req, res) => {
    if(!req.session)
        return res.send({error:"Cannot find session id, restart page"});
    if(Game.findGameByUserId(req.session.id))
        return res.send({error:"You are already in-game"});
    let username;
    if(typeof req.body.username === 'string' && req.body.username !== "")
        username = req.body.username;
    else
        username = req.session.username || "Unset username";

    req.session.username = username;
    const newGameId = Game.add(req.session.id, username);
    if(!newGameId)
        return res.send({error:"second user is already in that game"});
    res.send({gameid: newGameId});
});

app.post('/api/join', (req, res) => {
    if(!req.session)
        return res.send({error:"Cannot find session id, restart page"});

    let username;
    if(typeof req.body.username === 'string' && req.body.username !== "")
        username = req.body.username;
    else
        username = req.session.username || "Unset username";

    req.session.username = username;
    const game = Game.findByGameId(req.body.gameid);
    if(!game)
        return res.send({error: "Game with this id does not exist!"});
    if(Game.findGameByUserId(req.session.id))
        return res.send({error: "You are already in different game"});
    const gameId = game.addSecondPlayer(req.session.id, username);
    if(gameId)
        res.send({gameid: gameId});
    else
        res.send({error:"game is already full"});
});

app.get('/api/games', (req, res) => {
    res.send(Game.games);
});

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'client', 'build', 'index.html'))
});

app.all('*', (req, res) => {
    res.redirect('/');
});

io.use((socket, next) => {
    sessionMiddleware(socket.request, socket.request.res || {}, next);
});
io.use((socket, next) => {
    if(socket.request.session)
        return next();
    socket.disconnect();
});

io.on('connection',socket => {
    try{
        Game.logInUserSocket(socket);
    }catch(e){
        console.log(e);
    }
});

server.listen((process.env.port || 5000), () => {
    console.log("Server is listening on port " + (process.env.port || 4000) + "...");
});