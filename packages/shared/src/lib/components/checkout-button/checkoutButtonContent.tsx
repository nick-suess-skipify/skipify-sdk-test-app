import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { ReactComponent as MutedLogo } from '../../../assets/mutedLogo.svg';

// Be careful with cyclic dependencies here

export const SkipifyButtonContent: React.FC = (props) => {
  // This will be used later for passing variables from checkout script to this component
  const params = new URL(window.location.href).searchParams;
  const [textColor,setTextColor] = useState(params.get('textColor') || '#fff');
  const [cobrandedLogo, setCobrandedLogo] = useState("")

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

  const handleIframeMessage = (event: MessageEvent) => {
    const { data } = event;
    if (!data) {
      return;
    }
    if (data.name === "@skipify/merchant-public-info-fetched" && data.merchant?.cobranding?.logoSrc) {
      setCobrandedLogo(data.merchant?.cobranding?.logoSrc)
    }
  }

  useEffect(() => {
    if (params.get('cobrandedLogo')) {
      setCobrandedLogo(params.get('cobrandedLogo') as string)
    }
    if (params.get('textColor')) {
      setTextColor(params.get('textColor') as string)
    }
    window.addEventListener('message', handleIframeMessage);
    return () => {
      window.removeEventListener('message', handleIframeMessage)
    }
  }, [])

  return (
    <Container onClick={() => handleClick()} style={{color : textColor}}>
      <StyledMutedLogo />
      Buy Now{cobrandedLogo ? <><Divider /><CobrandedLogo src={cobrandedLogo} /></> : ""}
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

const Divider = styled.div`
  background: #fff;
  width: 1px;
  height: 22px;
  flex-shrink: 0;
  margin-left: 12px;
  margin-right: 12px;
`

const CobrandedLogo = styled.img`
  max-height: 24px;
`
