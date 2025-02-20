import React from 'react';
import { createRoot } from 'react-dom/client';
import { SkipifyButtonContent } from './checkoutButtonContent';

const render = async () => {
    const target = document.getElementById('root');
    if (!target) {
        console.error('Missing element #root');
        return;
    }
    const root = createRoot(target);
    root.render(
        <div>
            <SkipifyButtonContent />
        </div>,
    );
};

if (document.readyState === 'complete' || document.readyState === 'interactive') {
    render();
} else {
    window.addEventListener('load', render);
}
