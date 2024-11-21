import React, { useEffect, useState, useRef } from 'react';
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
    Badge,
    Switch
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
    const [authRes, setAuthRes] = useState<any>({});
    const [authPhone, setAuthPhone] = useState('');
    const authContainerRef = useRef<HTMLDivElement>(null);

    const [sendOtp, setSendOtp] = useState(false);

    useEffect(() => {
        // Check for Skipify client in the window
        const checkClient = () => {
            if ((window as any).skipify && !skipifyClient) {
                const initializedClient = new (window as any).skipify({
                    merchantId: MERCHANT_ID,
                });

                // Exposing the Skipify client to help testing in the console
                (window as any).skipifyClient = initializedClient;

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

    const handleAuthentication = async (
        targetId: string,
        displayMode: 'embedded' | 'overlay'
    ) => {
        if (!lookupRes.challengeId) return;

        skipifyClient?.authentication(lookupRes, {
            onSuccess: (results: any) => {
                setAuthRes(results);
            },
            onError: (error: any) => {
                setAuthRes({ error });
            },
            phone: authPhone,
            sendOtp,
            displayMode,
        }).render(targetId);
    };

    return (
        <Container>
            <Heading mt="24px" mb="40px" as='h2'>
                Embedded Components Playground
            </Heading>
            <VStack align="left" spacing='48px' divider={<StackDivider borderColor='gray.200' />}>
                <Box>
                    <Box mb="32px" position='relative'>
                        <Divider />
                        <AbsoluteCenter bg='white' px='4'>
                            <b>Lookup</b>
                        </AbsoluteCenter>
                    </Box>
                    <FormControl mb="16px" isRequired>
                        <FormLabel>Email</FormLabel>
                        <Input 
                            id="email-input"
                            type='text' 
                            value={email} 
                            onChange={(e) => setEmail(e.target.value)} 
                        />
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
                            data-testid="lookup-button"
                        >
                            Lookup
                        </Button>
                    </Stack>

                    <Text fontSize='md'>Response: <Badge {...lookupResProps}>{lookupResStatus}</Badge><Badge>{lookupResponseTime}</Badge></Text>
                    <Code><JSONPretty id="json-pretty" data={lookupRes}></JSONPretty></Code>
                </Box>

                <VStack spacing='24px' align='left'>
                    <Box mb="32px" position='relative'>
                        <Divider />
                        <AbsoluteCenter bg='white' px='4'>
                            <b>Authentication</b>
                        </AbsoluteCenter>
                    </Box>

                    <FormControl mb="16px">
                        <FormLabel>Authentication Phone Number (Optional)</FormLabel>
                        <Input 
                            type='text' 
                            value={authPhone} 
                            onChange={(e) => setAuthPhone(e.target.value)} 
                            placeholder="Optional phone number"
                        />
                    </FormControl>

                    <FormControl display="flex" alignItems="center" mb="16px">
                        <FormLabel htmlFor="send-otp-switch" mb="0">
                            Send OTP
                        </FormLabel>
                        <Switch
                            id="send-otp-switch"
                            isChecked={sendOtp}
                            onChange={() => setSendOtp(!sendOtp)}
                        />
                    </FormControl>

                    <Button
                        mt={4}
                        colorScheme='teal'
                        type='button'
                        onClick={() => handleAuthentication('merchant-auth-container', 'embedded')}
                        isDisabled={!lookupRes.challengeId}
                        data-testid="render-authenticate-button"
                    >
                        Render Authenticate
                    </Button>



                    <Button
                        mt={4}
                        colorScheme='blue'
                        type='button'
                        onClick={() => handleAuthentication('email-input', 'overlay')}
                        isDisabled={!lookupRes.challengeId}
                        data-testid="render-authenticate-overlay-button"
                    >
                        Render Authenticate Overlay
                    </Button>

                    <div 
                        id="merchant-auth-container" 
                        ref={authContainerRef}
                        style={{ 
                            border: '1px dashed #718096', 
                            borderRadius: '8px',
                            padding: '16px',
                            marginTop: '16px',
                            minHeight: '100px',
                            backgroundColor: 'rgba(0, 0, 255, 0.1)'
                        }}
                        data-testid="merchant-auth-container"
                    >
                        Target for authentication iframe (#merchant-auth-container)
                    </div>


                    <Text fontSize='md'>Response: </Text>

                    <Code><JSONPretty id="json-pretty-auth" data={authRes}></JSONPretty></Code>
                </VStack>
            </VStack>
        </Container>
    );
};
