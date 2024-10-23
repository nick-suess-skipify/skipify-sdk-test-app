import React, { useEffect, useState } from 'react';
import JSONPretty from 'react-json-pretty';
import {
    Container,
    VStack,
    Stack,
    Box,
    StackDivider,
    AbsoluteCenter,
    Divider,
    Heading,
    FormControl,
    FormLabel,
    Input,
    Code,
    Text,
    Button,
    Badge
} from '@chakra-ui/react' // Import Chakra UI components and VStack

// Be careful with cyclic dependencies here

const MERCHANT_ID = '59958510-0316-4d68-9b03-ff189d0fb3e3';

export const TestPageContent: React.FC = () => {
    const [skipifyClient, setSkipifyClient] = useState<any>(null);

    // Inputs
    const [email, setEmail] = useState('')
    const [phone, setPhone] = useState('')

    // Responses
    const [lookupRes, setLookupRes] = useState<any>({})
    const [lookupResponseTime, setLookupResponseTime] = useState<string>('')
    const [lookupLoading, setLookupLoading] = useState(false)

    useEffect(() => {
        // Check for Skipify client in the window
        const checkClient = () => {
            if ((window as any).skipify && !skipifyClient) {
                const initializedClient = new (window as any).skipify({
                    merchantId: MERCHANT_ID,
                });

                setSkipifyClient(initializedClient);
            } else {
                setTimeout(checkClient, 200); // Check again after 200ms
            }
        };

        checkClient();
    }, []);

    const handleLookup = async () => {
        try {
            setLookupLoading(true)

            const startTime = Date.now();
            const res = await skipifyClient?.lookup({ email, phone })
            const endTime = Date.now();

            setLookupResponseTime(`${endTime - startTime} ms`)
            setLookupLoading(false)

            setLookupRes(res)
        } catch (e) {
            setLookupRes(e)
        }
    }

    const lookupResProps: any = {}
    let lookupResStatus = '';
    if (lookupRes.challengeId) {
        lookupResProps.colorScheme = 'teal' // success
        lookupResStatus = 'OK'
    } else if (lookupRes.error) {
        lookupResProps.colorScheme = 'red' // error
        lookupResStatus = 'ERROR'
    }


    return (
        <Container>
            <Heading mt="24px" mb="40px" as='h2'>
                Embedded Components Playground
            </Heading>
            <VStack align="left" spacing='24px' divider={<StackDivider borderColor='gray.200' />}>
                <Box>
                    <Box mb="32px" position='relative'>
                        <Divider />
                        <AbsoluteCenter bg='white' px='4'>
                            <b>Lookup</b>
                        </AbsoluteCenter>
                    </Box>
                    <FormControl mb="16px" isRequired>
                        <FormLabel>Email</FormLabel>
                        <Input type='text' value={email} onChange={(e) => setEmail(e.target.value)} />
                    </FormControl>
                    <FormControl mb="16px">
                        <FormLabel>Phone</FormLabel>
                        <Input type='text' value={phone} onChange={(e) => setPhone(e.target.value)} />
                    </FormControl>

                    <Stack mb="16px" spacing={4} direction='row' align='center'>
                        <Button
                            mt={4}
                            colorScheme='teal'
                            type='button'
                            onClick={() => handleLookup()}
                            isLoading={lookupLoading}
                        >
                            Lookup
                        </Button>
                    </Stack>

                    <Text fontSize='md'>Response: <Badge {...lookupResProps}>{lookupResStatus}</Badge><Badge>{lookupResponseTime}</Badge></Text>
                    <Code><JSONPretty id="json-pretty" data={lookupRes}></JSONPretty></Code>
                    <Divider mt="32px" />
                </Box>
            </VStack>
        </Container>
    );
};
