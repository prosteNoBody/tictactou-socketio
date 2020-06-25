import React, {useEffect, useState} from 'react';
import styled from 'styled-components';
import axios from 'axios';
import {Helmet} from 'react-helmet';

import LoginForm from './components/LoginForm';
import GameManager from './components/GameManager';
import LoadingIcon from './components/LoadingIcon';

const CenterWrapper = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  
  height: 100vh;
  width: 100vw;
`;

const App = () => {
    const [existingGame, setExistingGame] = useState(false);
    const [gameId, setGameId] = useState("");
    const [contentReady,setContentReady] = useState(false);

    useEffect(() => {
        let unmounted = false;

        axios.post('http://localhost:5000/api/rejoin')
            .then(({data}) => {
                if(unmounted)
                    return;
                setContentReady(true);
                if(data.error)
                    return;
                setGameId(data.gameid);
                setExistingGame(true);
            })
            .catch(() => {
                if(unmounted)
                    return;
                setContentReady(true);
            });

        return () => {
            unmounted = true
        }
    },[]);

    const kickFromSocket = () => {
        setExistingGame(false);
    };

    const createGame = (username) => {
        axios.post('http://localhost:5000/api/create',{
            username: username
        })
            .then(({data}) => {
                if(data.error)
                    return console.log(data.error);
                setGameId(data.gameid);
                setExistingGame(true);
            });
    };

    const joinGame = (username, gameId) => {
        axios.post('http://localhost:5000/api/join',{
            username: username,
            gameid: gameId
        })
            .then(({data}) => {
                if(data.error)
                    return console.log(data.error);
                setGameId(data.gameid);
                setExistingGame(true);
            });
    };

    const leaveGame = () => {
        axios.post('/api/leave')
            .then(({data}) => {
                if(data.error)
                    return console.log(data.error);
                window.history.pushState({},"","/");
                setExistingGame(false);
                setGameId("");
            });
    };

    return (
        <CenterWrapper>
            <Helmet>
                <script src="https://kit.fontawesome.com/93e85ab53d.js" crossOrigin="anonymous"/>
            </Helmet>
            {existingGame ? <GameManager kickFromSocket={kickFromSocket} leaveGame={leaveGame} gameId={gameId}/> : (contentReady ? <LoginForm createGame={createGame} joinGame={joinGame}/> : <LoadingIcon/>)}
        </CenterWrapper>
    );
};

export default App;