import styled from "styled-components";

const LoadingIcon = styled.div`
  width: 4em;
  height: 4em;
  margin: 1rem;
  border-radius: 50%;
  
  border: 3px solid grey;
  border-left: 3px solid lightgrey;
  
  animation: rotating 1s infinite;
  animation-timing-function: ease-in-out;
  @keyframes rotating{
    0%{
      transform: rotate(0deg);
    }
    100%{
      transform: rotate(360deg);
    }
  } 
`;

export default LoadingIcon;