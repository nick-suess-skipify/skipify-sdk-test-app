import React, { useState, useEffect, useRef } from 'react';
import styled from 'styled-components';
import { ReactComponent as MutedLogo } from '../../../assets/mutedLogo.svg';

// Be careful with cyclic dependencies here

const MERCHANT_ID = '59958510-0316-4d68-9b03-ff189d0fb3e3';

export const TestPageContent: React.FC = (props) => {

    const [merchantId, setMerchantId] = useState(MERCHANT_ID)
    const [skipifyClient, setSkipifyClient] = useState<any>(null)
    const buttonRef = useRef(null)
    const inputRef = useRef(null)

    useEffect(() => {
        // Check for Skipify client in the window
        const checkClient = () => {
            if ((window as any).skipify && !skipifyClient) {
                const initializedClient = new (window as any).skipify({
                    merchantId,
                })

                setSkipifyClient(initializedClient);
            } else {
                setTimeout(checkClient, 200); // Check again after 200ms
            }
        };

        checkClient();
    }, []);

    useEffect(() => {
        if (buttonRef?.current && skipifyClient) {
            const options = {
                onClose: (myRef: string, success: boolean) => {
                    console.log('On close')
                },
                onApprove: (myRef: string, data: any) => {
                    console.log('On approve')
                }
            }

            // Render Skipify button
            skipifyClient.button("my-ref-test", options).render(buttonRef.current)

            // Enable input listener
            skipifyClient.email("my-email-ref-test").enable(inputRef.current)
        }

    }, [buttonRef, skipifyClient])


    return (
        <Page>
            <Container>
                <StyledMutedLogo />
                <Section>
                    <Label>Merchant Id</Label>
                    <Input type="text" value={merchantId} onChange={(e) => setMerchantId(e.target.value)} />
                    <Label>Button</Label>
                    <ButtonContainer ref={buttonRef}></ButtonContainer>
                    <Label>Email listener</Label>
                    <Input type="text" ref={inputRef} />
                </Section>
            </Container>
        </Page>
    );
};

const Page = styled.div`
    height: 100vh;
    display: flex;
    flex-direction: column;
    align-items: center;
`;

const Container = styled.div`
    max-width: 900px;
    width: 100%;
    margin-left: auto;
    box-sizing: border-box;
    margin-right: auto;
    display: block;
    padding-left: 16px;
    padding-right: 16px;
`

const ButtonContainer = styled.div`

`

const Section = styled.div`
    width: 360px;
`;

const StyledMutedLogo = styled(MutedLogo)`
    padding: 22px 24px;
`;

const Label = styled.label`
    color: rgb(117, 117, 117);
    font-family: Poppins;
    font-weight: 400;
    font-size: 1rem;
    line-height: 2em;
    padding: 0px;
    position: relative;
    display: block;
`

const Input = styled.input`
    width: 100%;
    padding: 6px 12px;
    font-size: 16px;
    font-weight: 400;
    line-height: 1.5;
    color: #212529;
    background-color: #fff;
    background-clip: padding-box;
    border: 1px solid #ced4da;
    appearance: none;
    border-radius: 4px;
    transition: border-color .15s ease-in-out,box-shadow .15s ease-in-out;
    :focus{
        color: #212529;
        background-color: #fff;
        border-color: #86b7fe;
        outline: 0;
        box-shadow: 0 0 0 0.25rem rgb(13 110 253 / 25%);
    }          
`
