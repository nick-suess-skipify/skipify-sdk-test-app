import { SkipifyElementIds, SkipifyClassNames } from '@checkout-sdk/shared/lib/constants';

interface HTMLElementWithObserver extends HTMLElement {
    _resizeObserver?: ResizeObserver | null;
}

export function launchHiddenIframe(iframeSrc: string, id?: string) {
    const iframeEl = document.createElement('iframe');
    iframeEl.allow = 'publickey-credentials-get *';
    iframeEl.style.border = 'none';
    iframeEl.style.visibility = 'hidden';
    iframeEl.style.position = 'absolute';
    iframeEl.style.width = '1px';
    iframeEl.style.height = '1px';
    iframeEl.style.pointerEvents = 'none';

    iframeEl.id = id || SkipifyElementIds.iframe;

    iframeEl.src = iframeSrc;

    document.body.appendChild(iframeEl);
    return iframeEl;
}

export function launchIframe(iframeSrc: string, customId: string, container?: HTMLElement, displayMode?: string) {
    const iframeEl = document.createElement('iframe');
    iframeEl.allow = 'publickey-credentials-get *';

    iframeEl.style.border = 'none';
    iframeEl.id = customId;
    iframeEl.src = iframeSrc;

    if (displayMode === 'overlay') {
        iframeEl.classList.add(SkipifyClassNames.componentOverlayIframe);
        const overlayEl = createOverlay(container);
        overlayEl.appendChild(iframeEl);
        displayOverlay(overlayEl);
        
        const arrowEl = document.getElementById(SkipifyElementIds.iframeArrow);
        if (arrowEl) {
            showArrowWhenIframeShown(iframeEl, arrowEl);
        }
    } else {
        iframeEl.style.height = '0px';
        iframeEl.style.width = '100%';
        if (container) container.innerHTML = '';
        (container || document.body).appendChild(iframeEl);
    }
    return iframeEl;
}
/**
 * Create the overlay backdrop and little arrow pointing to the check button
 * @param emailInput - Email input element
 * @returns Overlay element
 */
export function createOverlay(emailInput?: HTMLElement): HTMLElement {
    if (emailInput) {
        createWrapper(emailInput);
    }

    const overlayEl = document.createElement('div');
    overlayEl.id = SkipifyElementIds.overlay;

    const arrowEl = document.createElement('div');
    arrowEl.id = SkipifyElementIds.iframeArrow;

    overlayEl.appendChild(arrowEl);
    document.body.appendChild(overlayEl);

    return overlayEl;
}

/**
 * Round a number to the nearest device pixel ratio
 * @param value - Number to round
 * @returns Rounded number
 */
function roundByDPR(value: number) {
    const dpr = window.devicePixelRatio || 1;
    return Math.round(value * dpr) / dpr;
}

/**
 * Display the overlay
 * The overlay is hidden by css by default, attach skipify body class to body will make it visible
 * @param overlayEl - Overlay element
 */
function displayOverlay(overlayEl: HTMLElement) {
    document.body.classList.add(SkipifyClassNames.body);

    // Ensure that the opacity transition is applied
    setTimeout(() => {
        overlayEl.style.opacity = '1';
    }, 10);

    // If the page is too short to scroll, we don't need the scroll animation
    const isScrollable = document.documentElement.scrollHeight > window.innerHeight;

    positionIframeInOverlay(isScrollable);
}

/**
 * Create a wrapper element for the email input and inject checkmark button
 * @param emailInput - Email input element
 * @returns Wrapper element
 */
function createWrapper(emailInput: HTMLElement): HTMLElement {
    const wrapper = document.createElement('div');
    wrapper.id = SkipifyElementIds.emailWrapper;

    const button = document.createElement('div');
    button.id = SkipifyElementIds.checkButton;
    button.innerHTML = `<svg id="_SKIPIFY_check_icon" style="display: block;" viewBox="0 0 24 24" data-testid="CheckIcon"><path d="M9 16.17 4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"></path></svg>`;

    const buttonSize = emailInput.getBoundingClientRect().height - 4;
    button.style.width = `${buttonSize}px`;
    button.style.height = `${buttonSize}px`;
    button.style.display = 'flex';

    const emailStyles = window.getComputedStyle(emailInput);

    wrapper.style.display = emailStyles.display;


    // This is a workaround for inline-* elements that also has 100% width set
    // We cannot read 100% applied with javascript
    if (emailInput.parentElement) {
        const parentWidth = emailInput.parentElement.getBoundingClientRect().width;
        const emailWidth = emailInput.getBoundingClientRect().width;

        if (parentWidth === emailWidth) {
            wrapper.style.width = '100%';
        }
    }

    const stylePropertiesToCopy = [
        'border-top-right-radius',
        'border-top-left-radius',
        'border-bottom-right-radius',
        'border-bottom-left-radius',
    ];

    for (const property of stylePropertiesToCopy) {
        const borderRadius = emailStyles.getPropertyValue(property);
        if (borderRadius) {
            const borderRadiusValue = parseFloat(borderRadius.replace(/px|em|rem|%/, ''));
            button.style.setProperty(property, `${buttonSize / borderRadiusValue}%`);
        }
    }

    emailInput.parentNode?.replaceChild(wrapper, emailInput);
    wrapper.appendChild(emailInput);
    wrapper.appendChild(button);

    return wrapper;
}

/**
 * Update position the iframe and arrow in the overlay
 * @param shouldScroll - Whether to scroll to input
 */
export function positionIframeInOverlay(shouldScroll = false) {
    const iframe = document.querySelector(`.${SkipifyClassNames.componentOverlayIframe}`) as HTMLElementWithObserver;
    const button = document.querySelector(`#${SkipifyElementIds.checkButton}`);

    if (!iframe || !button) {
        return;
    }

    const buttonPosition = button.getBoundingClientRect();

    if (!buttonPosition || !document.body.classList.contains(SkipifyClassNames.body)) {
        return;
    }

    const totalHeight = document.documentElement.scrollHeight;
    const totalWidth = window.innerWidth;

    const buttonAbsolutePosition = buttonPosition.top + window.scrollY;
    const shouldDisplayOnTop = buttonAbsolutePosition > totalHeight / 2;

    if (shouldScroll) {
        const scrollY = shouldDisplayOnTop
            ? buttonAbsolutePosition + buttonPosition.height - window.innerHeight + 16
            : buttonAbsolutePosition - 16;

        window.scrollTo({ top: scrollY, behavior: 'smooth' });
        return;
    }

    if (shouldDisplayOnTop) {
        iframe.style.bottom = window.innerHeight - buttonPosition.top + 16 + 'px';
    } else {
        iframe.style.bottom = '';
    }

    const { width: iframeWidth } = iframe.getBoundingClientRect();

    const translateX =
        totalWidth > 490
            ? Math.max(roundByDPR(buttonPosition.right - iframeWidth), 36)
            : totalWidth > iframeWidth
                ? roundByDPR((totalWidth - iframeWidth) / 2)
                : 0;
    const translateY = shouldDisplayOnTop ? 0 : roundByDPR(buttonPosition.bottom + 16);
    const remainingSpace = shouldDisplayOnTop
        ? buttonPosition.top
        : roundByDPR(window.innerHeight - buttonPosition.bottom);

    const maxHeight = Math.max(remainingSpace - 24, 0);

    iframe.style.left = '0';
    iframe.style.transform = `translate(${translateX}px, ${translateY}px)`;
    iframe.style.maxHeight = `${maxHeight}px`;

    const arrowIframe = document.getElementById(SkipifyElementIds.iframeArrow);
    const arrowPositionX = roundByDPR(buttonPosition.right - 33);
    const arrowPositionY = shouldDisplayOnTop ? roundByDPR(buttonPosition.top - 36) : roundByDPR(translateY - 5);
    if (arrowIframe) {
        arrowIframe.style.transform = `translate(${arrowPositionX}px, ${arrowPositionY}px)`;
    }
}

/**
 * Show arrow icon only if iframe has some height
 * This is to deal with the problem when iframe takes longer to load, arrow will pop up first
 */
function showArrowWhenIframeShown(iframe: HTMLElementWithObserver, arrowElement: HTMLElement) {
    arrowElement.style.opacity = '0';
    
    if (iframe._resizeObserver) {
        iframe._resizeObserver.disconnect();
    }
    
    const resizeObserver = new ResizeObserver(entries => {
        for (const entry of entries) {
            const height = entry.contentRect.height;
            if (height > 20) {
                arrowElement.style.opacity = '1';
                resizeObserver.disconnect();
                iframe._resizeObserver = null;
            }
        }
    });
    
    iframe._resizeObserver = resizeObserver;
    resizeObserver.observe(iframe);
}

/**
 * Remove the overlay, overlay iframe, and check button etc.
 */
export function removeUI() {
    document.body.classList.remove(SkipifyClassNames.body);

    const overlayEl = document.getElementById(SkipifyElementIds.overlay);
    if (overlayEl) {
        overlayEl.remove();
    }

    const iframeEl = document.getElementById(SkipifyElementIds.iframe);
    if (iframeEl) {
        iframeEl.remove();
    }

    const overlayIframeEls = document.querySelectorAll(`.${SkipifyClassNames.componentOverlayIframe}`);
    overlayIframeEls.forEach((overlayIframeEl) => {
        overlayIframeEl.remove();
    });

    const checkButtonEl = document.getElementById(SkipifyElementIds.checkButton);
    if (checkButtonEl) {
        checkButtonEl.remove();
    }
}
