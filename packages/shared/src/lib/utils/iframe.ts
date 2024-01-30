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
  hasInitializedIframe: boolean
) {
  // SP-2455 : Retrieve forced device id if any, this will replace fingerprint js device id
  // todo: re-evaluate after fingerprint js issue resolved (mark)
  const forceDeviceId = localStorage.getItem('skipify_force_device_id');

  if (forceDeviceId) {
    const url = new URL(iframeSrc);
    url.searchParams.set('forceDeviceId', forceDeviceId);
    iframeSrc = url.toString();
  }

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

  containerEl?.appendChild(iframeEl);

  return iframeEl;
}

export function displayIframe(isSkipifyLayerEnabled = false) {
  if (isSkipifyLayerEnabled) {
    const checkIcon = document.getElementById('_SKIPIFY_check_icon');
    if (checkIcon) checkIcon.style.display = 'block';
    const expandIcon = document.getElementById('_SKIPIFY_expand_more_icon');
    if (expandIcon) expandIcon.style.display = 'none';
  }
  const existingOverlay = document.getElementById(SkipifyElementIds.overlay);

  if (existingOverlay) {
    document.body.classList.add(SkipifyClassNames.body);

    // Added a setTimeout here to ensure that the opacity transition is applied
    setTimeout(() => {
      existingOverlay.style.opacity = '1';
    }, 10);
  }
}

export function hideIframe(isSkipifyLayerEnabled = false) {
  if (isSkipifyLayerEnabled) {
    const checkIcon = document.getElementById('_SKIPIFY_check_icon');
    if (checkIcon) checkIcon.style.display = 'none';
    const expandIcon = document.getElementById('_SKIPIFY_expand_more_icon');
    if (expandIcon) expandIcon.style.display = 'block';
  }

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
