import React, { useEffect, useState } from 'react';
import { Container, Heading, Text, VStack } from '@chakra-ui/react'; // Import Chakra UI components and VStack

// Be careful with cyclic dependencies here

const MERCHANT_ID = '59958510-0316-4d68-9b03-ff189d0fb3e3';

export const TestPageContent: React.FC = () => {
    const [skipifyClient, setSkipifyClient] = useState<any>(null);

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

    return (
        <Container maxW="container.md" p={4}>
            <VStack spacing={4} align="start"> {/* Use VStack for vertical spacing */}
                <Heading>
                    Embedded Components Playground
                </Heading>
                <Text>
                    Please check the console to verify if the SDK is initialized.
                </Text>
                <Text>
                    Other content coming soon...
                </Text>
            </VStack>
        </Container>
    );
};
