function isOidValid(orderDataStr: string) {
    try {
      const orderData = JSON.parse(orderDataStr);
      // Check if the current time is less than the saved TTL
      return Date.now() < orderData.OID_TTL;
    } catch (error) {
      console.warn("Error parsing order data or no data", error);
      return false;
    }
  }
  
  export function insertResumableBtn(emailInputElem: HTMLElement, onClick = () => console.log("Clicked")) {
    if (isOidValid(localStorage.getItem("ORDER_DATA") || "")) {
      console.log("@@@@@@@@ OID VALID WHILE PROCESSING INPUT?");
      
      // Check if the checkmark has already been added to prevent duplicates
      if (!document.getElementById('checkmarkContainer')) {
        // Get the computed styles of the element
        const styles = window.getComputedStyle(emailInputElem);
        // Calculate the height without the border
        const borderWidth = parseInt(styles.borderBottomWidth, 10);
        const height = emailInputElem.offsetHeight - 2 * borderWidth; // Subtract top and bottom borders
    
        // Define the HTML for the checkmark
        const checkmarkHTML = `
          <span id="checkmarkContainer" style="
            position: absolute;
            top: 50%;
            right: -${borderWidth}px; /* Overlapping the border */
            transform: translateY(-50%);
            display: inline-block;
            width: ${height}px; /* Adjusted for border */
            height: ${height}px;
            background-color: black;
            color: white;
            text-align: center;
            line-height: ${height}px; /* To center the checkmark vertically */
            font-size: ${height * 0.6}px; /* Adjust checkmark size */
            cursor: pointer;
          ">✔</span>
        `;
    
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
              checkmarkElem.onclick = onClick; // Assign the click handler
            }
          }
        } else {
          console.log("Email input not found.");
        }
      }
    }
  }
  