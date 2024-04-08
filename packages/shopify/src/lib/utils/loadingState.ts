import { SkipifyElementIds } from "@checkout-sdk/shared";
import { SdkUrl } from "@checkout-sdk/shared";

const loadingImageHTML = `<img src="${SdkUrl}/shopify/sk-loader.gif">`;

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

    return `
          <span id="loaderContainer" style="
            position: absolute;
            top: 50%;
            right: 1px; /* Matches Input Button Style */
            transform: translateY(-50%);
            display: none;
            align-items: center;
            justify-content: center;
            width: ${height}px; /* Adjusted for border */
            height: ${height}px;
            background-color: black;
            color: white;
            border-radius: ${borderRadiusStyle}; /* Dynamically set based on emailInput */
            text-align: center;
            font-size: ${height * 0.6}px; /* Adjust checkmark size */
            cursor: pointer;
          ">${loadingImageHTML}</span>
        `;
}

export function insertLoadingStateElement(emailInputElem: HTMLElement) {
    if (!document.getElementById('loaderContainer') && (!document.getElementById(SkipifyElementIds.loadingParallelogram) || document.getElementById(SkipifyElementIds.loadingParallelogram)?.style.display === "none")) {
        const loadingHTML = createLoadingParallelogramHTML(emailInputElem);
        
        if (emailInputElem) {
            const parentElem = emailInputElem.parentElement;
            if (parentElem) {
                parentElem.style.position = 'relative';
                parentElem.style.overflow = 'hidden';
                emailInputElem.style.paddingRight = `${emailInputElem.getBoundingClientRect().height}px`; // Adjust space for the loading indicator
                emailInputElem.insertAdjacentHTML('afterend', loadingHTML);
            }
        } else {
            console.log("Email input element not found.");
        }
    }
}
