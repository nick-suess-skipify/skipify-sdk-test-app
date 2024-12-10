import { SdkUrl, SkipifyElementIds } from "../constants";

const loadingImageHTML = `<img src="${SdkUrl}/shared/assets/sk-loader.gif" alt="loading">`;

function createLoadingParallelogramHTML(emailInputElem: HTMLElement) {
    const styles = window.getComputedStyle(emailInputElem);
    const height = emailInputElem.getBoundingClientRect().height - 4; // Consistent with button styling
    const borderRadiusProps = ['border-top-right-radius', 'border-top-left-radius', 'border-bottom-right-radius', 'border-bottom-left-radius'];

    // Calculating border-radius values based on the button's approach
    const borderRadiusStyle = borderRadiusProps.map(prop => {
        const borderRadius = styles.getPropertyValue(prop);
        if (borderRadius) {
            const borderRadiusValue = parseFloat(borderRadius.replace(/px|em|rem|%/, ''));
            return `${height / borderRadiusValue}%`; // Consistent with button styling adaptation
        }
        return '0'; // Default to 0 if no borderRadius is found
    }).join(' ');

    const loaderElement = document.createElement('span');
    loaderElement.id = 'loaderContainer';

    Object.assign(loaderElement.style, {
        position: 'absolute',
        top: '50%',
        right: '2px', // Matches Input Button Style
        transform: 'translateY(-50%)',
        display: 'none',
        alignItems: 'center',
        justifyContent: 'center',
        width: `${height}px`, // Adjusted for border
        height: `${height}px`,
        backgroundColor: 'black',
        color: 'white',
        borderRadius: `${borderRadiusStyle}`, // Dynamically set based on emailInput
        textAlign: 'center',
        fontSize: `${height * 0.6}px`, // Adjust checkmark size
        cursor: 'pointer'
    });

    loaderElement.innerHTML = loadingImageHTML;

    return loaderElement;
}

export function insertLoadingStateElement(emailInputElem: HTMLElement, overrideStyles: Record<string, string | number> = {}) {
    if (!document.getElementById('loaderContainer') && (!document.getElementById(SkipifyElementIds.loadingParallelogram) || document.getElementById(SkipifyElementIds.loadingParallelogram)?.style.display === "none")) {
        const loaderElement = createLoadingParallelogramHTML(emailInputElem);

        if (emailInputElem) {
            const parentElem = emailInputElem.parentElement;
            if (parentElem) {
                parentElem.style.position = 'relative';
                parentElem.style.overflow = 'hidden';
                emailInputElem.style.paddingRight = `${emailInputElem.getBoundingClientRect().height}px`; // Adjust space for the loading indicator

                Object.keys(overrideStyles).forEach((key) => {
                    (loaderElement?.style as any)[key] = overrideStyles[key];
                });
                emailInputElem.insertAdjacentElement('afterend', loaderElement);
            }
        } else {
            console.log("Email input element not found.");
        }
    }
}
