import { SkipifyElementIds, SdkUrl, getIsDarkColor } from "../../shared";

interface OwnProps {
  node: HTMLElement;
}

type Props = OwnProps;

export class EnrollmentCheckbox {
  node: HTMLElement;
  constructor({ node }: Props) {
    this.node = node;
    this.start();
  }

  start() {
    const isDarkColor = getIsDarkColor(
      getComputedStyle(document.body).backgroundColor
    );

    const wrapperEl = document.createElement("div");
    wrapperEl.id = SkipifyElementIds.enrollmentCheckbox;

    const enrollmentCheckboxFrame = document.createElement("iframe");
    let enrollmentCheckBoxUrl = `${SdkUrl}/components/iframe_skipifyEnrollmentCheckbox.html?date=${new Date().getTime()}`;
    if (isDarkColor) {
      enrollmentCheckBoxUrl += "&darkMode=true";
    }
    enrollmentCheckboxFrame.src = enrollmentCheckBoxUrl;
    enrollmentCheckboxFrame.id = `${SkipifyElementIds.enrollmentCheckbox}_frame`;

    wrapperEl.appendChild(enrollmentCheckboxFrame);

    this.node.parentNode?.prepend(wrapperEl);
  }
}
