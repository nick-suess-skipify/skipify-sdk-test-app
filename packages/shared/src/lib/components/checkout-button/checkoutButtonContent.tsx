import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { ReactComponent as MutedLogo } from '../../../assets/mutedLogo.svg';

// Be careful with cyclic dependencies here

export const SkipifyButtonContent: React.FC = (props) => {
  // This will be used later for passing variables from checkout script to this component
  const params = new URL(window.location.href).searchParams;
  const [textColor,setTextColor] = useState(params.get('textColor') || '#fff');
  const [bgColor,setBgColor] = useState(params.get('bgColor') || '#000000');

  // if user forgot to set hover color, it should fallback to custom bgColor first, as #444444 could be not compatible with custom bgColor
  const [bgHoverColor,setBgHoverColor] = useState(params.get('bgHoverColor') || params.get('bgColor') || '#444444');
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
    if (params.get('bgColor')) {
      setBgColor(params.get('bgColor') as string)
    }
    if (params.get('bgHoverColor')) {
      setBgHoverColor(params.get('bgHoverColor') as string)
    }
    window.addEventListener('message', handleIframeMessage);
    return () => {
      window.removeEventListener('message', handleIframeMessage)
    }
  }, [])

  return (
    <Container onClick={() => handleClick()} bgColor={bgColor} hoverColor={bgHoverColor}  style={{color : textColor }}>
      <StyledMutedLogo />
      Buy Now{cobrandedLogo ? <><Divider /><CobrandedLogo src={cobrandedLogo} /></> : ""}
    </Container>
  );
};

const Container = styled.div<{ bgColor: string; hoverColor: string }>`
    display: flex;
    flex-direction: row;
    font-family: Poppins;
    height: 54px;
    align-items: center;
    justify-content: center;
    border-radius: 4px;
    background: ${props => props.bgColor};
    font-size: 19px;
    font-style: normal;
    font-weight: 600;
    cursor: pointer;

    &:hover {
        background-color: ${props => props.hoverColor};
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
