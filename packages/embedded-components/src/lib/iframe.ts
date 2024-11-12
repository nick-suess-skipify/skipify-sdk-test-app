import { SkipifyElementIds } from "@checkout-sdk/shared/lib/constants";

export function launchHiddenIframe(iframeSrc: string) {
    const iframeEl = document.createElement('iframe');
    iframeEl.allow = 'publickey-credentials-get *';
    iframeEl.style.border = 'none';

    iframeEl.id = SkipifyElementIds.iframe;
    iframeEl.src = iframeSrc;

    document.body.appendChild(iframeEl);
    return iframeEl;
}

export function launchIframe(iframeSrc: string, customId: string, container?: HTMLElement, ) {
    const iframeEl = document.createElement('iframe');
    iframeEl.allow = 'publickey-credentials-get *';
    
    iframeEl.style.width = '100%';
    iframeEl.style.border = 'none';
    iframeEl.style.height = '0px';
    
    iframeEl.id = customId;
    iframeEl.src = iframeSrc;

    if (container) {
        container.innerHTML = ''; // Clear any existing content
        container.appendChild(iframeEl);
    } else {
        document.body.appendChild(iframeEl);
    }
    return iframeEl;
}
