export function getIsDarkColor(color: string) {
  const formattedColor = color.match(
    /^rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*(\d+(?:\.\d+)?))?\)$/
  ) as any;

  const r = formattedColor[1];
  const g = formattedColor[2];
  const b = formattedColor[3];

  // HSP (Highly Sensitive Poo) http://alienryderflex.com/hsp.html
  const hsp = Math.sqrt(0.299 * (r * r) + 0.587 * (g * g) + 0.114 * (b * b));

  if (hsp > 127.5) {
    return false;
  } else {
    return true;
  }
}

export const phoneRegex = new RegExp(/\d{10}/);

export function cleanPhoneNumber(phoneNumber = "") {
  const cleanedPhoneNumber = phoneNumber.replace(/\D/g, "");
  if (phoneRegex.test(cleanedPhoneNumber)) {
    return cleanedPhoneNumber;
  } else {
    return "";
  }
}
