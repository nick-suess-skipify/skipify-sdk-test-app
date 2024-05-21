import { SkipifyElementIds } from "../constants";

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

export const phoneRegex = new RegExp(/^\d{10}$/);

export function cleanPhoneNumber(phoneNumber = '') {
  const cleanedPhoneNumber = phoneNumber.replace(/\D/g, '');
  if (phoneRegex.test(cleanedPhoneNumber)) {
    return cleanedPhoneNumber;
  } else {
    return '';
  }
}

export function roundByDPR(value: number) {
  const dpr = window.devicePixelRatio || 1;
  return Math.round(value * dpr) / dpr;
}

export function removeCheckmarkButton() {
  // This is for the resumable iframe check
  const checkmarkContainer = document.getElementById('checkmarkContainer');
  if (checkmarkContainer) {
    checkmarkContainer.style.display = 'none';
  }
}

export function showCheckmarkButton() {
  // This is for the resumable iframe check
  const checkmarkContainer = document.getElementById('checkmarkContainer');
  if (checkmarkContainer) {
    checkmarkContainer.style.display = 'flex';
  }
}

export function showSkipifyCheck() {
  const button = document.getElementById(SkipifyElementIds.checkButton)
  if(button) {
    button.style.display = 'flex'
  }
}

export function showCheckIcon() {
  const checkIcon = document.getElementById('_SKIPIFY_check_icon');
  if (checkIcon) checkIcon.style.display = 'block';
  const expandIcon = document.getElementById('_SKIPIFY_expand_more_icon');
  if (expandIcon) expandIcon.style.display = 'none';
}

export function showExpandIcon(showOnTop = false) {
  const checkIcon = document.getElementById('_SKIPIFY_check_icon');
  if (checkIcon) checkIcon.style.display = 'none';
  const expandIcon = document.getElementById('_SKIPIFY_expand_more_icon');
  if (expandIcon) {
    expandIcon.style.display = 'block';
    if(showOnTop) {
        expandIcon.style.transform = 'rotate(180deg)';
    }
  }
}

export function isExpandButtonAvailable() {
  const expandIcon = document.getElementById('_SKIPIFY_expand_more_icon');
  return !!expandIcon
}

export function showLoader() {
  const loaderContainer = document.getElementById("loaderContainer");
  if(loaderContainer) {
    loaderContainer.style.display = 'flex'
  }
}

export function hideLoader() {
  const loaderContainer = document.getElementById("loaderContainer");
  if(loaderContainer) {
    loaderContainer.style.display = 'none'
  }
}

export function isEmailValid(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}