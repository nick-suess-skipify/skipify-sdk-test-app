import { Messenger, SkipifyElementIds } from "@checkout-sdk/shared";

interface OrderData {
  OID_TTL: number;
  CART_DATA: unknown;
  EMAIL: string;
  OID: string;
}

function parseOrderData(): OrderData | null {
  try {
    const orderDataStr = localStorage.getItem("ORDER_DATA") || "{}";
    return JSON.parse(orderDataStr) as OrderData;
  } catch (error) {
    console.warn("Error parsing order data", error);
    return null;
  }
}

function isOidValid(orderData: OrderData | null) {
    try {
      if(!orderData) return false;
      return Date.now() < orderData.OID_TTL;
    } catch (error) {
      console.warn("Error parsing order data or no data", error);
      return false;
    }
  }

  const checkmarkSvg = (inputHeight: number) =>  `
  <svg width="${inputHeight/1.75}" height="${inputHeight/1.75}" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
<g clip-path="url(#clip0_6436_28157)">
<path d="M6.75012 12.1274L3.62262 8.99988L2.55762 10.0574L6.75012 14.2499L15.7501 5.24988L14.6926 4.19238L6.75012 12.1274Z" fill="#FEFEFE"/>
</g>
<defs>
<clipPath id="clip0_6436_28157">
<rect width="${inputHeight/1.75}" height="${inputHeight/1.75}" fill="white"/>
</clipPath>
</defs>
</svg>`

  function createCheckMarkHtml(borderWidth: number, height:number) {
    return `
          <span id="checkmarkContainer" style="
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
          ">${checkmarkSvg(height)}</span>
        `;
  }

  
  //On click we need to resume data with saved email;
  // add force param to test - todo remove after
  export function insertResumableBtn(emailInputElem: HTMLElement, messenger: Messenger) {
    const orderData = parseOrderData();
    if (isOidValid(orderData)) {
      // Check if the checkmark has already been added to prevent duplicates
      if (!document.getElementById('checkmarkContainer') && (!document.getElementById(SkipifyElementIds.checkButton) || document.getElementById(SkipifyElementIds.checkButton)?.style.display === "none")) {
        // Get the computed styles of the element
        const styles = window.getComputedStyle(emailInputElem);
        // Calculate the height without the border
        const borderWidth = parseInt(styles.borderBottomWidth, 10);
        const height = emailInputElem.offsetHeight - 2 * borderWidth; // Subtract top and bottom borders
        
        const checkmarkHTML = createCheckMarkHtml(borderWidth, height);
        // Inject the HTML using insertAdjacentHTML
        if (emailInputElem) {
          // Ensure the parent element is positioned relatively
          const parentElem = emailInputElem.parentElement;
          if (parentElem) {
            parentElem.style.position = 'relative';
            parentElem.style.overflow = 'hidden'; // To allow the checkmark to overlap the input borders
            emailInputElem.style.paddingRight = `${height + borderWidth}px`; // Make space for the checkmark
            emailInputElem.insertAdjacentHTML('afterend', checkmarkHTML);
            const checkmarkElem = document.getElementById('checkmarkContainer');
            if (checkmarkElem) {
              checkmarkElem.onclick = () => messenger.lookupUser(orderData?.EMAIL as string, orderData?.CART_DATA, true) 
            }
          }
        } else {
          console.log("Email input not found.");
        }
      }
    } else {
      //IF OID not valid
      localStorage.removeItem("ORDER_DATA")
    }
  }

  export async function injectSavedEmail(emailInputElem: HTMLInputElement) {
    const orderData = parseOrderData();
    //If orderdata has an email, and the emailInputElement is empty add email
    if (orderData?.EMAIL && emailInputElem?.value === '') {
      // Set the email input element's value to the saved email
      emailInputElem.value = orderData.EMAIL;
    } 
  }
  