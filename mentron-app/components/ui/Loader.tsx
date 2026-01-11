"use client";

import React from 'react';
import styled from 'styled-components';

const Loader = () => {
    return (
        <StyledWrapper>
            <div className="loader">
                <p>loading</p>
                <div className="words">
                    <span className="word">buttons</span>
                    <span className="word">forms</span>
                    <span className="word">switches</span>
                    <span className="word">cards</span>
                    <span className="word">buttons</span>
                </div>
            </div>
        </StyledWrapper>
    );
}

const StyledWrapper = styled.div`
  .loader {
    color: rgb(124, 124, 124);
    font-family: inherit;
    font-weight: 500;
    font-size: 25px;
    box-sizing: content-box;
    height: 40px;
    padding: 10px 10px;
    display: flex;
    border-radius: 8px;
  }

  .words {
    overflow: hidden;
    position: relative;
    height: 100%;
    /* Use mask-image to create the fade effect transparently */
    mask-image: linear-gradient(
      to bottom,
      transparent 0%,
      black 20%,
      black 80%,
      transparent 100%
    );
    -webkit-mask-image: linear-gradient(
      to bottom,
      transparent 0%,
      black 20%,
      black 80%,
      transparent 100%
    );
  }

  .word {
    display: block;
    height: 100%;
    padding-left: 10px;
    color: #00C6FF; /* Updated to brand Cyan */
    animation: spin_4991 4s infinite;
  }

  @keyframes spin_4991 {
    10% {
      transform: translateY(-102%);
    }
    25% {
      transform: translateY(-100%);
    }
    35% {
      transform: translateY(-202%);
    }
    50% {
      transform: translateY(-200%);
    }
    60% {
      transform: translateY(-302%);
    }
    75% {
      transform: translateY(-300%);
    }
    85% {
      transform: translateY(-402%);
    }
    100% {
      transform: translateY(-400%);
    }
  }
`;

export default Loader;
