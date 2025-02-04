import { SkipifyElementIds, SdkUrl, getIsDarkColor } from '..';

interface OwnProps {
  node: HTMLElement;
  insertionType?: 'prepend' | 'append';
  customStyles?: Partial<CSSStyleDeclaration>
}

type Props = OwnProps;

export class EnrollmentCheckbox {
  node: HTMLElement;
  insertionType: 'prepend' | 'append';
  customStyles: Partial<CSSStyleDeclaration> = {}
  constructor({ node, insertionType = 'prepend', customStyles = {} }: Props) {
    this.node = node;
    this.insertionType = insertionType;
    this.customStyles = customStyles;
    this.start();
  }

  start() {
    const isDarkColor = getIsDarkColor(
      getComputedStyle(document.body).backgroundColor
    );

    const wrapperEl = document.createElement('div');
    wrapperEl.id = SkipifyElementIds.enrollmentCheckbox;

    const enrollmentCheckboxFrame = document.createElement('iframe');
    let enrollmentCheckBoxUrl = `${SdkUrl}/shared/components/iframe_enrollmentCheckbox.html?date=${new Date().getTime()}`;
    if (isDarkColor) {
      enrollmentCheckBoxUrl += '&darkMode=true';
    }
    enrollmentCheckboxFrame.src = enrollmentCheckBoxUrl;
    enrollmentCheckboxFrame.id = `${SkipifyElementIds.enrollmentCheckbox}_frame`;

    wrapperEl.appendChild(enrollmentCheckboxFrame);

    Object.assign(wrapperEl.style, this.customStyles);

    if (this.insertionType === 'append') {
      this.node.parentNode?.append(wrapperEl);
    } else {
      this.node.parentNode?.prepend(wrapperEl);
    }
  }
}
