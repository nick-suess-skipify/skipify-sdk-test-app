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
    Switch,
    Select,
} from '@chakra-ui/react'; // Import Chakra UI components and VStack

// Be careful with cyclic dependencies here

const MERCHANT_ID = '59958510-0316-4d68-9b03-ff189d0fb3e3';

export const TestPageContent: React.FC = () => {
    const [skipifyClient, setSkipifyClient] = useState<any>(null);

    // MID
    const queryParams = new URLSearchParams(window.location.search);
    const [merchantId, setMerchantId] = useState(queryParams.get('merchantId') || MERCHANT_ID);
    const [deviceId, setDeviceId] = useState(queryParams.get('deviceId') || '');

    // Inputs
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');

    // Responses
    const [lookupRes, setLookupRes] = useState<any>({});
    const [lookupResponseTime, setLookupResponseTime] = useState<string>('');
    const [lookupLoading, setLookupLoading] = useState(false);
    const [authRes, setAuthRes] = useState<any>({});
    const [authPhone, setAuthPhone] = useState('');
    const authContainerRef = useRef<HTMLDivElement>(null);
    const [deviceIdRes, setDeviceIdRes] = useState<any>({});

    const [sendOtp, setSendOtp] = useState(false);

    const [carouselPhone, setCarouselPhone] = useState('');
    const [amount, setamount] = useState('80');
    const carouselContainerRef = useRef<HTMLDivElement>(null);
    const [carouselRes, setCarouselRes] = useState<any>({});

    const [carouselSendOtp, setCarouselSendOtp] = useState(false);

    // Authentication config states
    const [authTheme, setAuthTheme] = useState<string | undefined>(undefined);
    const [authFontFamily, setAuthFontFamily] = useState<string | undefined>(undefined);
    const [authFontSize, setAuthFontSize] = useState<string | undefined>(undefined);
    const [authInputFieldSize, setAuthInputFieldSize] = useState<string | undefined>(undefined);
    // Carousel config states
    const [carouselTheme, setCarouselTheme] = useState<string | undefined>(undefined);
    const [carouselFontFamily, setCarouselFontFamily] = useState<string | undefined>(undefined);
    const [carouselFontSize, setCarouselFontSize] = useState<string | undefined>(undefined);
    const [carouselInputFieldSize, setCarouselInputFieldSize] = useState<string | undefined>(undefined);
    useEffect(() => {
        // Check for Skipify client in the window
        const checkClient = () => {
            if ((window as any).skipify && !skipifyClient) {
                const initializedClient = new (window as any).skipify({
                    merchantId,
                });

                // Exposing the Skipify client to help testing in the console
                (window as any).skipifyClient = initializedClient;

                setSkipifyClient(initializedClient);

                if (deviceId) {
                    const skipifyIframe = document.getElementById('_SKIPIFY_iframe') as HTMLIFrameElement;
                    if (skipifyIframe && skipifyIframe.src) {
                        const url = new URL(skipifyIframe.src);
                        url.searchParams.set('forceDeviceId', deviceId);
                        skipifyIframe.src = url.toString();
                    }
                }
            } else {
                setTimeout(checkClient, 200); // Check again after 200ms
            }
        };

        checkClient();
    }, [merchantId]);

    const handleLookup = async () => {
        try {
            setLookupLoading(true);

            const startTime = Date.now();
            const res = await skipifyClient?.lookup({ email, phone });
            const endTime = Date.now();

            setLookupResponseTime(`${endTime - startTime} ms`);
            setLookupLoading(false);

            setLookupRes(res);
        } catch (e) {
            setLookupLoading(false);
            setLookupRes(e);
        }
    };

    const lookupResProps: any = {};
    let lookupResStatus = '';
    if (lookupRes.challengeId) {
        lookupResProps.colorScheme = 'teal'; // success
        lookupResStatus = 'OK';
    } else if (lookupRes.error) {
        lookupResProps.colorScheme = 'red'; // error
        lookupResStatus = 'ERROR';
    }

    const handleAuthentication = async (targetId: string, displayMode: 'embedded' | 'overlay') => {
        if (!lookupRes.challengeId) return;
        const element = document.getElementById(targetId);

        skipifyClient
            ?.authentication(lookupRes, {
                onSuccess: (results: any) => {
                    setAuthRes(results);
                },
                onError: (error: any) => {
                    setAuthRes({ error });
                },
                phone: authPhone,
                sendOtp,
                displayMode,
                config: {
                    theme: authTheme,
                    fontFamily: authFontFamily,
                    fontSize: authFontSize,
                    inputFieldSize: authInputFieldSize,
                },
            })
            .render(element);
    };

    const handleCarousel = async (
        targetId: string,
        useLookupResponse = false,
        displayMode: 'embedded' | 'overlay' = 'embedded',
    ) => {
        const element = document.getElementById(targetId);
        skipifyClient
            ?.carousel(useLookupResponse ? lookupRes : authRes, {
                onSelect: (results: any) => {
                    setCarouselRes(results);
                },
                onError: (error: any) => {
                    setCarouselRes({ error });
                },
                phone: carouselPhone,
                amount: Number(amount),
                sendOtp: carouselSendOtp,
                displayMode,
                config: {
                    theme: carouselTheme,
                    fontFamily: carouselFontFamily,
                    fontSize: carouselFontSize,
                    inputFieldSize: carouselInputFieldSize,
                },
            })
            .render(element);
    };

    const handleSavePlaygroundSettings = () => {
        const url = new URL(window.location.href);
        url.searchParams.set('merchantId', merchantId);
        url.searchParams.set('deviceId', deviceId);
        window.location.href = url.toString();
    };

    const handleGetDeviceId = async () => {
        const res = await skipifyClient?.getDeviceId();
        setDeviceIdRes(res);
    };

    return (
        <Container>
            <Heading mt="24px" mb="40px" as="h2">
                Embedded Components Playground
            </Heading>
            <VStack align="left" spacing="48px" divider={<StackDivider borderColor="gray.200" />}>
                <Box>
                    <Box mb="32px" position="relative">
                        <Divider />
                        <AbsoluteCenter bg="white" px="4">
                            <b>Playground Settings</b>
                        </AbsoluteCenter>
                    </Box>
                    <FormControl mb="16px">
                        <FormLabel>MID</FormLabel>
                        <Input type="text" value={merchantId} onChange={(e) => setMerchantId(e.target.value)} />
                    </FormControl>
                    <FormControl mb="16px">
                        <FormLabel>Device ID</FormLabel>
                        <Input type="text" value={deviceId} onChange={(e) => setDeviceId(e.target.value)} />
                    </FormControl>
                    <Stack mb="16px" spacing={4} direction="row" align="center">
                        <Button
                            mt={4}
                            colorScheme="teal"
                            type="button"
                            onClick={() => handleSavePlaygroundSettings()}
                            data-testid="mid-button"
                        >
                            Save
                        </Button>
                    </Stack>
                </Box>
                <Box>
                    <Box mb="32px" position="relative">
                        <Divider />
                        <AbsoluteCenter bg="white" px="4">
                            <b>Lookup</b>
                        </AbsoluteCenter>
                    </Box>
                    <FormControl mb="16px">
                        <FormLabel>Email</FormLabel>
                        <Input id="email-input" type="text" value={email} onChange={(e) => setEmail(e.target.value)} />
                    </FormControl>
                    <FormControl mb="16px">
                        <FormLabel>Phone</FormLabel>
                        <Input type="text" value={phone} onChange={(e) => setPhone(e.target.value)} />
                    </FormControl>

                    <Stack mb="16px" spacing={4} direction="row" align="center">
                        <Button
                            mt={4}
                            colorScheme="teal"
                            type="button"
                            onClick={() => handleLookup()}
                            isLoading={lookupLoading}
                            data-testid="lookup-button"
                        >
                            Lookup
                        </Button>
                    </Stack>

                    <Text fontSize="md">
                        Response: <Badge {...lookupResProps}>{lookupResStatus}</Badge>
                        <Badge>{lookupResponseTime}</Badge>
                    </Text>
                    <Code>
                        <JSONPretty id="json-pretty" data={lookupRes}></JSONPretty>
                    </Code>
                </Box>

                <VStack spacing="24px" align="left">
                    <Box mb="32px" position="relative">
                        <Divider />
                        <AbsoluteCenter bg="white" px="4">
                            <b>Authentication</b>
                        </AbsoluteCenter>
                    </Box>

                    <FormControl mb="16px">
                        <FormLabel>Authentication Phone Number (Optional)</FormLabel>
                        <Input
                            type="text"
                            value={authPhone}
                            onChange={(e) => setAuthPhone(e.target.value)}
                            placeholder="Optional phone number"
                        />
                    </FormControl>

                    <FormControl display="flex" alignItems="center" mb="16px">
                        <FormLabel htmlFor="send-otp-switch" mb="0">
                            Send OTP
                        </FormLabel>
                        <Switch id="send-otp-switch" isChecked={sendOtp} onChange={() => setSendOtp(!sendOtp)} />
                    </FormControl>

                    <Stack direction="row" spacing={4} mb="16px">
                        <FormControl>
                            <FormLabel>Theme</FormLabel>
                            <Select value={authTheme || ''} onChange={(e) => setAuthTheme(e.target.value || undefined)}>
                                <option value="">not set</option>
                                <option value="light">light</option>
                                <option value="dark">dark</option>
                                <option value="invalid">invalid value</option>
                            </Select>
                        </FormControl>

                        <FormControl>
                            <FormLabel>Font Family</FormLabel>
                            <Select
                                value={authFontFamily || ''}
                                onChange={(e) => setAuthFontFamily(e.target.value || undefined)}
                            >
                                <option value="">not set</option>
                                <option value="serif">serif</option>
                                <option value="sans-serif">sans-serif</option>
                                <option value="default">default</option>
                                <option value="invalid">invalid value</option>
                            </Select>
                        </FormControl>

                        <FormControl>
                            <FormLabel>Font Size</FormLabel>
                            <Select
                                value={authFontSize || ''}
                                onChange={(e) => setAuthFontSize(e.target.value || undefined)}
                            >
                                <option value="">not set</option>
                                <option value="small">small</option>
                                <option value="medium">medium</option>
                                <option value="large">large</option>
                                <option value="invalid">invalid value</option>
                            </Select>
                        </FormControl>
                    </Stack>

                    <FormControl>
                        <FormLabel>Input Field Size</FormLabel>
                        <Select
                            value={authInputFieldSize || ''}
                            onChange={(e) => setAuthInputFieldSize(e.target.value || undefined)}
                        >
                            <option value="">not set</option>
                            <option value="small">small</option>
                            <option value="medium">medium</option>
                        </Select>
                    </FormControl>

                    <Button
                        mt={4}
                        colorScheme="teal"
                        type="button"
                        onClick={() => handleAuthentication('merchant-auth-container', 'embedded')}
                        isDisabled={!lookupRes.challengeId}
                        data-testid="render-authenticate-button"
                    >
                        Render Authenticate
                    </Button>

                    <Button
                        mt={4}
                        colorScheme="blue"
                        type="button"
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
                            backgroundColor: 'rgba(0, 0, 255, 0.1)',
                        }}
                        data-testid="merchant-auth-container"
                    >
                        Target for authentication iframe (#merchant-auth-container)
                    </div>

                    <Text fontSize="md">Response: </Text>

                    <Code>
                        <JSONPretty id="json-pretty-auth" data={authRes}></JSONPretty>
                    </Code>
                </VStack>

                {/* Add new Carousel section */}
                <VStack spacing="24px" align="left">
                    <Box mb="32px" position="relative">
                        <Divider />
                        <AbsoluteCenter bg="white" px="4">
                            <b>Carousel</b>
                        </AbsoluteCenter>
                    </Box>

                    <FormControl mb="16px">
                        <FormLabel>Carousel Phone Number (Optional)</FormLabel>
                        <Input
                            type="text"
                            value={carouselPhone}
                            onChange={(e) => setCarouselPhone(e.target.value)}
                            placeholder="Optional phone number (only works when using lookup response)"
                            isDisabled={!!authRes.shopperId && !!authRes.sessionId}
                        />
                    </FormControl>

                    <FormControl mb="16px">
                        <FormLabel>Amount</FormLabel>
                        <Input
                            type="number"
                            value={amount}
                            onChange={(e) => setamount(e.target.value)}
                            placeholder="Enter order total"
                        />
                    </FormControl>

                    <FormControl display="flex" alignItems="center" mb="16px">
                        <FormLabel htmlFor="carousel-send-otp-switch" mb="0">
                            Send OTP
                        </FormLabel>
                        <Switch
                            id="carousel-send-otp-switch"
                            isChecked={carouselSendOtp}
                            onChange={() => setCarouselSendOtp(!carouselSendOtp)}
                        />
                    </FormControl>

                    <Stack direction="row" spacing={4} mb="16px">
                        <FormControl>
                            <FormLabel>Theme</FormLabel>
                            <Select
                                value={carouselTheme || ''}
                                onChange={(e) => setCarouselTheme(e.target.value || undefined)}
                            >
                                <option value="">not set</option>
                                <option value="light">light</option>
                                <option value="dark">dark</option>
                                <option value="invalid">invalid value</option>
                            </Select>
                        </FormControl>

                        <FormControl>
                            <FormLabel>Font Family</FormLabel>
                            <Select
                                value={carouselFontFamily || ''}
                                onChange={(e) => setCarouselFontFamily(e.target.value || undefined)}
                            >
                                <option value="">not set</option>
                                <option value="serif">serif</option>
                                <option value="sans-serif">sans-serif</option>
                                <option value="default">default</option>
                                <option value="invalid">invalid value</option>
                            </Select>
                        </FormControl>

                        <FormControl>
                            <FormLabel>Font Size</FormLabel>
                            <Select
                                value={carouselFontSize || ''}
                                onChange={(e) => setCarouselFontSize(e.target.value || undefined)}
                            >
                                <option value="">not set</option>
                                <option value="small">small</option>
                                <option value="medium">medium</option>
                                <option value="large">large</option>
                                <option value="invalid">invalid value</option>
                            </Select>
                        </FormControl>
                    </Stack>

                    <FormControl>
                        <FormLabel>Input Field Size</FormLabel>
                        <Select
                            value={carouselInputFieldSize || ''}
                            onChange={(e) => setCarouselInputFieldSize(e.target.value || undefined)}
                        >
                            <option value="">not set</option>
                            <option value="small">small</option>
                            <option value="medium">medium</option>
                        </Select>
                    </FormControl>

                    <Button
                        mt={4}
                        colorScheme="teal"
                        type="button"
                        onClick={() => handleCarousel('merchant-carousel-container')}
                        isDisabled={!authRes.shopperId || !authRes.sessionId}
                        data-testid="render-carousel-button"
                    >
                        Render Carousel base on Auth Response
                    </Button>
                    <Text fontSize="sm" color="gray.500">
                        Authentication required before rendering carousel base on auth response!
                    </Text>

                    <Button
                        mt={4}
                        colorScheme="blue"
                        type="button"
                        onClick={() => handleCarousel('merchant-carousel-container', true)}
                        isDisabled={!lookupRes.challengeId || !!authRes.shopperId}
                        data-testid="render-carousel-lookup-button"
                    >
                        Render Carousel base on Lookup Response
                    </Button>

                    <Button
                        mt={4}
                        colorScheme="purple"
                        type="button"
                        onClick={() => handleCarousel('email-input', true, 'overlay')}
                        isDisabled={!lookupRes.challengeId || !!authRes.shopperId}
                        data-testid="render-carousel-lookup-overlay-button"
                    >
                        Render Carousel base on Lookup Response (Overlay Mode)
                    </Button>

                    <Text fontSize="sm" color="gray.500">
                        This enable merchant to render carousel without rendering authentication seperately
                    </Text>

                    <div
                        id="merchant-carousel-container"
                        ref={carouselContainerRef}
                        style={{
                            border: '1px dashed #718096',
                            borderRadius: '8px',
                            padding: '16px',
                            marginTop: '16px',
                            minHeight: '100px',
                            backgroundColor: 'rgba(0, 128, 0, 0.1)',
                        }}
                        data-testid="merchant-carousel-container"
                    >
                        Target for carousel iframe (#merchant-carousel-container)
                    </div>

                    <Text fontSize="md">Response: </Text>
                    <Code>
                        <JSONPretty id="json-pretty-carousel" data={carouselRes}></JSONPretty>
                    </Code>
                </VStack>

                <VStack spacing="24px" align="left">
                    <Box mb="32px" position="relative">
                        <Divider />
                        <AbsoluteCenter bg="white" px="4">
                            <b>config</b>
                        </AbsoluteCenter>
                    </Box>

                    <FormControl mb="16px">
                        <FormLabel>Theme</FormLabel>
                        <Select
                            value={carouselTheme || ''}
                            onChange={(e) => setCarouselTheme(e.target.value || undefined)}
                        >
                            <option value="">not set</option>
                            <option value="light">light</option>
                            <option value="dark">dark</option>
                            <option value="invalid">invalid value</option>
                        </Select>
                    </FormControl>

                    <FormControl mb="16px">
                        <FormLabel>Font Family</FormLabel>
                        <Select
                            value={carouselFontFamily || ''}
                            onChange={(e) => setCarouselFontFamily(e.target.value || undefined)}
                        >
                            <option value="">not set</option>
                            <option value="serif">serif</option>
                            <option value="sans-serif">sans-serif</option>
                            <option value="default">default</option>
                            <option value="invalid">invalid value</option>
                        </Select>
                    </FormControl>

                    <FormControl mb="16px">
                        <FormLabel>Font Size</FormLabel>
                        <Select
                            value={carouselFontSize || ''}
                            onChange={(e) => setCarouselFontSize(e.target.value || undefined)}
                        >
                            <option value="">not set</option>
                            <option value="small">small</option>
                            <option value="medium">medium</option>
                            <option value="large">large</option>
                            <option value="invalid">invalid value</option>
                        </Select>
                    </FormControl>
                </VStack>
                <VStack spacing="24px" align="left">
                    <Box mb={2} position="relative">
                        <Divider />
                        <AbsoluteCenter bg="white" px="4">
                            <b>Device</b>
                        </AbsoluteCenter>
                    </Box>

                    <Button
                        mt={2}
                        colorScheme="teal"
                        type="button"
                        onClick={handleGetDeviceId}
                        data-testid="render-authenticate-button"
                    >
                        Get Device ID
                    </Button>

                    <Text fontSize="md">Response: </Text>

                    <Code>
                        <JSONPretty id="json-pretty-auth" data={deviceIdRes}></JSONPretty>
                    </Code>
                </VStack>
            </VStack>
        </Container>
    );
};
