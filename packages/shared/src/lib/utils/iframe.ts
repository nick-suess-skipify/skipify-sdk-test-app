import { SkipifyElementIds, SkipifyClassNames } from '../constants';

export function getContainer(): HTMLElement {
  const overlayEl = document.createElement('div');
  overlayEl.id = SkipifyElementIds.overlay;
  overlayEl.style.display = 'none';
  overlayEl.style.opacity = '0';

  document.body.appendChild(overlayEl);
  return overlayEl;
}

export function getBaseIframe() {
  return document.getElementById(SkipifyElementIds.iframe) as HTMLIFrameElement;
}

export function launchHiddenIframe(iframeSrc: string) {
  const existingIframe = document.getElementById(SkipifyElementIds.iframe);
  const existingContainer = document.getElementById(SkipifyElementIds.overlay);

  if (existingIframe) {
    return;
  }

  let containerEl = existingContainer;
  if (!existingContainer) {
    containerEl = getContainer();
  }

  const iframeEl = document.createElement('iframe');
  iframeEl.allow = 'publickey-credentials-get *';
  iframeEl.style.border = 'none';
  iframeEl.id = SkipifyElementIds.iframe;
  iframeEl.src = iframeSrc;

  containerEl?.appendChild(iframeEl);

  return iframeEl;
}

export function displayIframe() {
  const existingOverlay = document.getElementById(SkipifyElementIds.overlay);

  if (existingOverlay) {
    document.body.classList.add(SkipifyClassNames.body);
    existingOverlay.style.display = 'block';

    // Added a setTimeout here to ensure that the opacity transition is applied
    setTimeout(() => {
      existingOverlay.style.opacity = '1';
    }, 10);
  }
}

export function closeIframe() {
  const overlayEl = document.getElementById(SkipifyElementIds.overlay);

  if (overlayEl) {
    document.body.removeChild(overlayEl);
  }

  document.body.classList.remove(SkipifyClassNames.body);
}

export function changeIframeHeight(height: number) {
  const iframeEl = document.getElementById(SkipifyElementIds.iframe);

  if (!iframeEl) {
    return;
  }

  iframeEl.style.height = `${height}px`;
}
