import { SkipifyElementIds } from "@checkout-sdk/shared";

const loadingParalelogramSVG = `
<svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M15.5 0.671066V10.8518L7.857 13.1331L3.857 14.327L0.5 15.329V5.14894L15.5 0.671066Z" fill="#01EAD3" stroke="#01EAD3"/>
</svg>
`

function createLoadingParallelogramHTML(borderWidth: number, height:number) {
    return `
          <span id="loaderContainer" style="
            position: absolute;
            top: 50%;
            right: -${borderWidth}px; /* Overlapping the border */
            transform: translateY(-50%);
            display: none;
            align-items: center;
            justify-content: center;
            width: ${height}px; /* Adjusted for border */
            height: ${height}px;
            background-color: black;
            color: white;
            text-align: center;
            font-size: ${height * 0.6}px; /* Adjust checkmark size */
            cursor: pointer;
          ">${loadingParalelogramSVG}</span>
        `;
  }
  
  //On click we need to resume data with saved email;
  // add force param to test - todo remove after
  export function insertLoadingStateElement(emailInputElem: HTMLElement) {
      // Check if the checkmark has already been added to prevent duplicates
      if (!document.getElementById('loaderContainer') && (!document.getElementById(SkipifyElementIds.loadingParallelogram) || document.getElementById(SkipifyElementIds.loadingParallelogram)?.style.display === "none")) {
        // Get the computed styles of the element
        const styles = window.getComputedStyle(emailInputElem);
        // Calculate the height without the border
        const borderWidth = parseInt(styles.borderBottomWidth, 10);
        const height = emailInputElem.offsetHeight - 2 * borderWidth; // Subtract top and bottom borders
        
        const loadingHTML = createLoadingParallelogramHTML(borderWidth, height);
        // Inject the HTML using insertAdjacentHTML
        if (emailInputElem) {
          // Ensure the parent element is positioned relatively
          const parentElem = emailInputElem.parentElement;
          if (parentElem) {
            parentElem.style.position = 'relative';
            parentElem.style.overflow = 'hidden'; // To allow the checkmark to overlap the input borders
            emailInputElem.style.paddingRight = `${height + borderWidth}px`; // Make space for the checkmark
            emailInputElem.insertAdjacentHTML('afterend', loadingHTML);
            const parallelogramContainer = document.getElementById('loaderContainer');
            if (parallelogramContainer) {
                // Action if needed
                // checkmarkElem.onclick = () => messenger.lookupUser(orderData?.EMAIL as string, orderData?.CART_DATA, true) 
            }
          }
        } else {
          console.log("Email input not found.");
        }
      }
  }