import React, { useState, useEffect, useRef } from 'react';
import styled from 'styled-components';
import {
    Container,
    VStack,
    Stack,
    Box,
    StackDivider,
    Heading,
    FormControl,
    FormLabel,
    Input,
    FormHelperText,
    Button,
    NumberInput,
    NumberInputField,
    NumberInputStepper,
    NumberIncrementStepper,
    NumberDecrementStepper
} from '@chakra-ui/react'
// import { ReactComponent as MutedLogo } from '../../../assets/mutedLogo.svg';

// Be careful with cyclic dependencies here

const MERCHANT_ID = '59958510-0316-4d68-9b03-ff189d0fb3e3';
const MERCHANT_REF = 'my-ref-test';
const ORDER_TOTAL = '51.73';
const parse = (val) => val.replace(/^\$/, '')
const format = (val) => `$` + val

export const TestPageContent: React.FC = (props) => {

    const queryParams = new URLSearchParams(window.location.search);


    const [merchantId, setMerchantId] = useState(queryParams.get('merchantId') || MERCHANT_ID)
    const [merchantRef, setMerchantRef] = useState(queryParams.get('merchantRef') || MERCHANT_REF)
    const [orderTotal, setOrderTotal] = useState(queryParams.get('orderTotal') || ORDER_TOTAL)
    const [skipifyClient, setSkipifyClient] = useState<any>(null)
    const buttonRef = useRef<HTMLDivElement | null>(null)
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
                    console.log('On close UI callback triggered')
                },
                onApprove: (myRef: string, data: any) => {
                    console.log('On approve UI callback triggered')
                    console.log(data)
                }
            }

            // Render Skipify button
            skipifyClient.button(merchantRef, { ...options, total: Number(orderTotal.replace('.','')) }).render(buttonRef.current)

            // Enable input listener
            skipifyClient.email(merchantRef).enable(inputRef.current)
        }

    }, [buttonRef, skipifyClient])

    const handleSave = () => {
        const url = new URL(window.location.href);
        url.searchParams.set('merchantId', merchantId);
        url.searchParams.set('merchantRef', merchantRef);
        url.searchParams.set('orderTotal', orderTotal);
        window.location.href = url.toString();
    }

    const handleReset = () => {
        const url = new URL(window.location.href);
        url.searchParams.delete('merchantId');
        url.searchParams.delete('merchantRef');
        url.searchParams.delete('orderTotal');
        window.location.href = url.toString();
    }

    const handleOrderTotalChange = (valueString) => {
        if (!valueString) {
            setOrderTotal('1')
        } else {
            setOrderTotal(parse(valueString))
        }
    }

    return (
        <Container>
            <Heading mt="24px" mb="16px" as='h2'>SDK Playground</Heading>
            <VStack align="left" spacing='24px' divider={<StackDivider borderColor='gray.200' />}>
                <Box w="360px">
                    <FormControl mb="16px" isRequired>
                        <FormLabel>Merchant Id</FormLabel>
                        <Input type='text' value={merchantId} onChange={(e) => setMerchantId(e.target.value)} />
                        {/* <FormHelperText>Your playground merchant Id.</FormHelperText> */}
                    </FormControl>
                    <FormControl>
                        <FormLabel>Simple Order total</FormLabel>
                        <NumberInput
                            step={10}
                            precision={2}
                            min={0.01}
                            onChange={(valueString) => handleOrderTotalChange(valueString)}
                            value={format(orderTotal)}
                        >
                            <NumberInputField />
                            <NumberInputStepper>
                                <NumberIncrementStepper />
                                <NumberDecrementStepper />
                            </NumberInputStepper>
                        </NumberInput>
                    </FormControl>
                    {/* <FormControl isRequired>
                        <FormLabel>Merchant ref</FormLabel>
                        <Input type='text' value={merchantRef} onChange={(e) => setMerchantRef(e.target.value)} />
                        <FormHelperText>Your merchant ref.</FormHelperText>
                    </FormControl> */}
                    <Stack spacing={4} direction='row' align='center'>
                        <Button
                            mt={4}
                            colorScheme='teal'
                            type='button'
                            onClick={() => handleSave()}
                        >
                            Save
                        </Button>
                        <Button
                            mt={4}
                            colorScheme='teal'
                            type='button'
                            onClick={() => handleReset()}
                        >
                            Reset
                        </Button>
                    </Stack>
                </Box>
                <Box>
                    <FormControl>
                        <FormLabel>Skipify Button</FormLabel>
                        <ButtonContainer ref={buttonRef}></ButtonContainer>
                        {/* <FormHelperText>Your Skipify checkout button.</FormHelperText> */}
                    </FormControl>
                </Box>
                <Box>
                    <FormControl>
                        <FormLabel>Skipify email listener</FormLabel>
                        <Input type="text" ref={inputRef} />
                        {/* <FormHelperText>Your Skipify email listener.</FormHelperText> */}
                    </FormControl>
                </Box>
            </VStack>

        </Container>
    );
};


const ButtonContainer = styled.div`
`
