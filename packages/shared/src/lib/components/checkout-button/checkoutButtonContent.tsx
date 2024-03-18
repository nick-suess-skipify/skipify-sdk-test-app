import React, { useState } from 'react';
import styled from 'styled-components';
import { ReactComponent as MutedLogo } from '../../../assets/mutedLogo.svg';

// Be careful with cyclic dependencies here

export const SkipifyButtonContent: React.FC = (props) => {
  // This will be used later for passing variables from checkout script to this component
  const params = new URL(window.location.href).searchParams;

  const handleClick = () => {
    if (params.get('id')) {
      window.top?.postMessage(
        {
          name: '@skipify/checkout-button-triggered',
          id: params.get('id')
        },
        '*'
      );
    }
  };

  return (
    <Container onClick={() => handleClick()}>
      <StyledMutedLogo />
      Buy Now
    </Container>
  );
};

const Container = styled.div`
  display: flex;
  flex-direction: row;
  font-family: Poppins;
  border-radius: 5px;
  height: 54px;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  background: #000;
  color: #fff;
  font-size: 19px;
  font-style: normal;
  font-weight: 600;
  cursor: pointer;
  &:hover {
    background-color: #444444;
  }
`;

const StyledMutedLogo = styled(MutedLogo)`
  margin-right: 10px;
`;
