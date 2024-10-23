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
