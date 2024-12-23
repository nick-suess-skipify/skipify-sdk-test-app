import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { ReactComponent as MutedLogo } from '../../../assets/mutedLogo.svg';
import { ReactComponent as PayNow } from '../../../assets/payNow.svg'
import { ReactComponent as BuyNow } from '../../../assets/buyNow.svg'
import { ReactComponent as PoweredBySkipify } from '../../../assets/poweredBySkipify.svg';


type LogoPlacement = 'inside' | 'below';
type ButtonLabel = 'Buy Now' | 'Pay Now';

export const SkipifyButtonContent: React.FC = (props) => {
  // This will be used later for passing variables from checkout script to this component
  const params = new URL(window.location.href).searchParams;
  const [visible, setVisible] = useState(false);
  const [textColor,setTextColor] = useState(params.get('textColor') || '#FEFEFE');
  const [bgColor,setBgColor] = useState(params.get('bgColor') || '#1E1E1E');

  // if user forgot to set hover color, it should fallback to custom bgColor first, as #444444 could be not compatible with custom bgColor
  const [bgHoverColor,setBgHoverColor] = useState(params.get('bgHoverColor') || params.get('bgColor') || '#444444');
  const [logoPlacement, setLogoPlacement] = useState<LogoPlacement>('inside');
  const [buttonLabel, setButtonLabel] = useState<ButtonLabel>('Buy Now');

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
    if (data.name === "@skipify/merchant-public-info-fetched" && data.merchant?.cobranding) {
      //load any merchant config here if any
      setVisible(true);
    }

  }

  useEffect(() => {
    if (params.get('textColor')) {
      setTextColor(params.get('textColor') as string)
    }
    if (params.get('bgColor')) {
      setBgColor(params.get('bgColor') as string)
    }
    if (params.get('bgHoverColor')) {
      setBgHoverColor(params.get('bgHoverColor') as string)
    }
    if (params.get('logoPlacement')) {
      // we already validated prop in SDK button.ts, so no need to validate here
      const logoPlacementParam = params.get('logoPlacement');
      setLogoPlacement(logoPlacementParam as LogoPlacement);
    }
    if (params.get('buttonLabel')) {
      const buttonLabelParam = params.get('buttonLabel');
      setButtonLabel(buttonLabelParam as ButtonLabel);
    }
    if (params.get('id')){
      window.top?.postMessage(
        {
          name: '@skipify/checkout-button-ready',
          id: params.get('id')
        },
        '*'
      );
    }
    window.addEventListener('message', handleIframeMessage);
    return () => {
      window.removeEventListener('message', handleIframeMessage)
    }
  }, [])


  if (!visible)  return null;

  return (
    <V2Container data-testid="checkout-button-container">
      <V2Button 
        onClick={() => handleClick()} 
        bgColor={bgColor} 
        hoverColor={bgHoverColor}
        style={{color: textColor}}
        data-testid="checkout-button"
      >
        {logoPlacement === 'inside' && <MutedLogo data-testid="skipify-logo-inside" />}
        {buttonLabel === 'Buy Now' ? 
          <BuyNow data-testid="buy-now" fill={textColor} /> : 
          <PayNow data-testid="pay-now" fill={textColor} />
        }
      </V2Button>
      {logoPlacement === 'below' && <PoweredBySkipify data-testid="skipify-logo-below" />}
    </V2Container>
  );

};



const V2Container = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
`;

const V2Button = styled.div<{ bgColor: string; hoverColor: string }>`
  cursor: pointer;
  display: flex;
  background: ${props => props.bgColor};
  height: 56px;
  min-width: 150px;
  border-radius: 12px;
  align-items: center;
  justify-content: center;
  gap: 10px;
  &:hover {
    background-color: ${props => props.hoverColor};
  }
`;
