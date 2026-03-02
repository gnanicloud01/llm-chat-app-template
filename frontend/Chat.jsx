import React, { useEffect } from 'react';
import ChatLayout from './ChatLayout';

export default function Chat() {
    useEffect(() => {
        import('./vanillaChat.js').then(module => {
            // Reattach selectors to new DOM and bind listeners
            if (module.refreshDOM) module.refreshDOM();
            if (module.attachListeners) module.attachListeners();
            module.init();
        }).catch(e => console.error(e));
    }, []);

    return <ChatLayout />;
}
