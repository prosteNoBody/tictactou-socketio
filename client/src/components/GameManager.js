import React, {useEffect, useState} from 'react';
import styled, {css} from 'styled-components';
import io from 'socket.io-client';

import LoadingIcon from './LoadingIcon';

const SOCKET_ENDPOINT = "http://localhost:5000";

const Container = styled.div`
  display: grid;
  grid-template-columns: 10rem 5rem 10rem;
  grid-template-rows: 6rem 25rem 4rem 4rem;
  grid-template-areas: 
  "profile1 playerTurn profile2"
  "game game game"
  "link link link"
  "leave leave leave";
  
  border-radius: 10px;
  
  border: 6px solid lightskyblue;
  background: white;
  
  filter: drop-shadow(0 0 0.5rem lightskyblue);
`;
const LoadingContainer = styled.div`
  grid-area: game;
  display: flex;
  justify-content: center;
  align-items: center;
`;
const UserProfile = styled.div`
  grid-area: ${props => props.gridArea};
  
  display: flex;
  justify-content: center;
  align-items: center;
  flex-direction: column;
  
  margin: 1rem;
  
  border: 1px solid grey;
  color: black;
  background: ${props => props.isOnline ? "whitesmoke" : "red"};
  
  text-align: center;
  
  transition: 100ms;
`;
const PlayerTurn = styled.div`
  grid-area: playerTurn;
  display: flex;
  justify-content: center;
  align-items: center;
  
  color: black;
  
  font-size: 2rem;
  
  transform: rotate(${props => props.mainPlayerTurn ? 0 : 180}deg);
  transition: 200ms;
`;
const GameContainer = styled.div`
  grid-area: game;
  display: grid;
  grid-template-columns: repeat(3,1fr);
  grid-template-rows: repeat(3,1fr);
  grid-template-areas: 
  "i00 i01 i02"
  "i10 i11 i12"
  "i20 i21 i22";
  
  margin: 0 .8rem;
`;
const GameBlock = styled.div`
  grid-area: ${props => props.gridArea};
  display: flex;
  justify-content: center;
  align-items: center;
  
  margin: 0.2rem;
  padding: 0.5rem;
  border-radius: 15px;
  
  color: black;
  background: ${props => props.win ? 'green' : (props.lose ? 'red' : 'grey')};
  
  font-size: 20px;
  
  transition: 100ms;
  & i{
    font-size: 5rem;
  }
  ${({effect}) => effect && css`
      background: lightgrey;
      
      cursor: pointer;
      &:hover{
        border: 6px solid #595959;
      }
      &:active{
        background: grey;
      }
`}
`;

const CopyLink = styled.div`
  grid-area: link;

  display: flex;
  justify-content: center;
  align-items: center;
  
  margin: 1rem 1rem 0 1rem;
  
  color: white;
  background: black;
  
  user-select: all;
  cursor: pointer;
`;

const LeaveButton = styled.div`
  grid-area: leave;
  display: flex;
  justify-content: center;
  align-items: center;
  
  margin: 1rem;

  color: white;
  background: indianred;
  border: 1px solid darkred;
  
  cursor: pointer;
  transition: 100ms;
  
  &:hover{
    background: darkred;
  }
`;

const GameManager = (props) => {
    let {gameId, leaveGame, kickFromSocket} = props;
    let players = [];
    const defaultGameState = {state: 0, turn:1 , players:[{name:"Loading...",isOnline: true, main:true, turn: 1}, {name:"Loading...",isOnline: true, main:false, turn: 2}]};
    const [gameData, setGameData] = useState(defaultGameState);
    const [winCondition, setWinCondition] = useState([]);
    const [winner, setWinner] = useState(0);
    const [playMove, setPlayMove] = useState(() => () => {});
    useEffect(() => {
            const socket = io(SOCKET_ENDPOINT);
            socket.on('disconnect', () => {
                setGameData(defaultGameState);
                kickFromSocket();
            });
            socket.on('gameUpdate', newGameState => {
                console.log("new data arrived");
                console.log(newGameState);
                setGameData(newGameState);
            });
            socket.on('winCondition', winPosition => {
                console.log(winPosition);
                 setWinCondition(winPosition.slice(1));
                 setWinner(winPosition[0]);
            });
            setPlayMove(() => (x,y) => {socket.emit('playerMove',{x:x,y:y})});
    },[]);

    useEffect(() => {
        window.history.pushState({},"Game","game/" + gameId);
    },[gameId]);

    players[0] = gameData.players.find(player => player.main) || {name:"Error",isOnline:false,main:true,turn:1};
    players[1] = gameData.players.find(player => !player.main) || {name:"Error",isOnline:false,main:false,turn:2};

    const createSymbol = (symbolCode) => {
        switch (symbolCode) {
            case 1:
                return <i aria-hidden className="far fa-circle"/>;
            case 2:
                return <i aria-hidden className="fas fa-times"/>;
            default:
                return;
        }
    };

    const createGameStateLayout = () => {
        if(gameData.state === 0)
            return (
                <LoadingContainer>
                    <LoadingIcon/>
                </LoadingContainer>
            );
        let gameBlocks = [];
        for(let x = 0;x < 3;x++){
            for(let y = 0;y < 3;y++){
                let blockId = "i" + x + y;
                let isWinPosition = false;
                for(let i = 0; i < winCondition.length; i++)
                    if(winCondition[i][0] === x && winCondition[i][1] === y)
                        isWinPosition = true;
                gameBlocks.push(<GameBlock effect={gameData.state === 1 && gameData.turn === players[0].turn} win={players[0].turn === winner && isWinPosition} lose={players[1].turn === winner && isWinPosition} key={blockId} gridArea={blockId} onClick={() => {playMove(x,y)}}>{gameData.gameState ? createSymbol(gameData.gameState[x][y]) : null}</GameBlock>);
            }
        }
        return (
            <GameContainer>
                {gameBlocks}
            </GameContainer>
        );
    };

    return (
        <Container>
            <PlayerTurn mainPlayerTurn={(players[0].turn === gameData.turn)}>
                <i aria-hidden className="fas fa-chevron-left"/>
            </PlayerTurn>

            <UserProfile isOnline={players[0].isOnline} gridArea="profile1">
                <div>{players[0].name}</div>
                <div>{createSymbol(players[0].turn)}</div>
            </UserProfile>

            <UserProfile isOnline={players[1].isOnline} gridArea="profile2">
                <div>{players[1].name}</div>
                <div>{createSymbol(players[1].turn)}</div>
            </UserProfile>

            {createGameStateLayout()}

            <CopyLink>{gameId}</CopyLink>
            <LeaveButton onClick={() => leaveGame()}>LEAVE GAME</LeaveButton>
        </Container>
    );
};

export default GameManager;
