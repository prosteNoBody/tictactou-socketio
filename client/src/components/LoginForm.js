import React, {useEffect, useState} from 'react';
import styled from 'styled-components';
import axios from 'axios';

const Container = styled.div`
  display: flex;
  flex-direction: column;
  
  padding: 2rem;
  
  border: 2px solid black;
  background: whitesmoke;
  filter: drop-shadow(0 0 0.75rem black);
`;
const StyledInput = styled.input`
  margin: 1rem;
  
  height: 2rem;
  
  text-align: center;
`;
const SubmitButton = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  
  height: 5rem;
  margin: 1rem;
  
  color: white;
  background: orange;
  border: 2px solid grey;
  
  font-weight: bold;
  
  user-select: none;
  transition: 100ms;
  cursor: pointer;
  
  &:hover{
    background: darkorange;
  }
`;
const JoinButton = styled(SubmitButton)`
  background: deepskyblue;
  
  &:hover{
    background: dodgerblue;
  }
`;

const LoginForm = (props) => {
    const {createGame, joinGame} = props;
    const [username, setUsername] = useState("");
    const [gameId, setGameId] = useState("");

    useEffect(() => {
        let unmounted = false;
        axios.get('http://localhost:5000/api/username')
            .then(({data}) => {
                  if(!unmounted){
                        setUsername(data.username || "");
                  }
            });
        return () => {
            unmounted = true
        }
    },[]);

    const changeUsernameValue = e => {
        setUsername(e.target.value);
    };

    const changeGameIdValue = e => {
        setGameId(e.target.value);
    };

    return (
        <Container>
            <StyledInput placeholder="username" type="username" value={username} onChange={changeUsernameValue}/>
            <StyledInput placeholder="gameid" type="gameId" value={gameId} onChange={changeGameIdValue}/>
            <SubmitButton onClick={() => createGame(username)}>CreateGame</SubmitButton>
            <JoinButton onClick={() => joinGame(username, gameId)}>JoinGame</JoinButton>
        </Container>
    )
};

export default LoginForm;