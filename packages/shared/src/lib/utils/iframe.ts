import { SkipifyElementIds, SkipifyClassNames } from '../constants';

export function getContainer(): HTMLElement {
  const overlayEl = document.createElement('div');
  overlayEl.id = SkipifyElementIds.overlay;

  const arrowEl = document.createElement('div');
  arrowEl.id = SkipifyElementIds.iframeArrow;

  overlayEl.appendChild(arrowEl);
  document.body.appendChild(overlayEl);
  return overlayEl;
}

export function getBaseIframe() {
  return document.getElementById(SkipifyElementIds.iframe) as HTMLIFrameElement;
}

export function launchHiddenIframe(
  iframeSrc: string,
  hasInitializedIframe: boolean,
  isSkipifyLayerEnabled = false
) {
  const existingIframe = document.getElementById(
    SkipifyElementIds.iframe
  ) as HTMLIFrameElement;

  if (existingIframe) {
    if (!hasInitializedIframe) {
      existingIframe.src = iframeSrc;
    }
    return;
  }

  const containerEl =
    document.getElementById(SkipifyElementIds.overlay) ?? getContainer();

  const iframeEl = document.createElement('iframe');
  iframeEl.allow = 'publickey-credentials-get *';
  iframeEl.style.border = 'none';

  iframeEl.id = SkipifyElementIds.iframe;
  iframeEl.src = iframeSrc;

  if (isSkipifyLayerEnabled) {
    iframeEl.classList.add(SkipifyClassNames.skipifyV2);
  } else {
    iframeEl.classList.remove(SkipifyClassNames.skipifyV2);
  }

  containerEl?.appendChild(iframeEl);

  return iframeEl;
}

export function displayIframe() {
  const existingOverlay = document.getElementById(SkipifyElementIds.overlay);

  if (existingOverlay) {
    document.body.classList.add(SkipifyClassNames.body);

    // Added a setTimeout here to ensure that the opacity transition is applied
    setTimeout(() => {
      existingOverlay.style.opacity = '1';
    }, 10);
  }
}

export function hideIframe() {
  document.body.classList.add(SkipifyClassNames.hiding);
  // Added a setTimeout here to ensure that the hiding animation is visible
  setTimeout(() => {
    document.body.classList.remove(SkipifyClassNames.body);
    document.body.classList.remove(SkipifyClassNames.hiding);
  }, 400);
}

export function changeIframeHeight(height: number) {
  const iframeEl = document.getElementById(SkipifyElementIds.iframe);

  if (!iframeEl) {
    return;
  }
  // Added a setTimeout here to ensure that the height transition is applied
  setTimeout(() => {
    iframeEl.style.height = `${height}px`;
  }, 10);
}
