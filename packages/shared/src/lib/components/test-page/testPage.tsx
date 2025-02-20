import React from 'react';
import { createRoot } from 'react-dom/client';
import { ChakraProvider } from '@chakra-ui/react';
import { TestPageContent } from './testPageContent';

const render = async () => {
    const target = document.getElementById('root');
    if (!target) {
        console.error('Missing element #root');
        return;
    }
    const root = createRoot(target);
    root.render(
        <div>
            <ChakraProvider>
                <TestPageContent />
            </ChakraProvider>
        </div>,
    );
};

if (document.readyState === 'complete' || document.readyState === 'interactive') {
    render();
} else {
    window.addEventListener('load', render);
}
