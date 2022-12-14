import { SkipifyClassNames, SdkUrl, getIsDarkColor } from "../shared";

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
    wrapperEl.id = SkipifyClassNames.enrollmentCheckbox;

    const enrollmentCheckboxFrame = document.createElement("iframe");
    let enrollmentCheckBoxUrl = `${SdkUrl}/iframe_skipifyEnrollmentCheckbox.html?date=${new Date().getTime()}`;
    if (isDarkColor) {
      enrollmentCheckBoxUrl += "&darkMode=true";
    }
    enrollmentCheckboxFrame.src = enrollmentCheckBoxUrl;

    enrollmentCheckboxFrame.style.border = "0";
    enrollmentCheckboxFrame.style.display = "block";
    enrollmentCheckboxFrame.style.height = "129px";
    enrollmentCheckboxFrame.style.width = "100%";
    enrollmentCheckboxFrame.style.overflow = "hidden";

    wrapperEl.appendChild(enrollmentCheckboxFrame);

    wrapperEl.style.marginBottom = "18px";
    wrapperEl.style.width = "calc(100% - 1px)";
    wrapperEl.style.margin = "0 0 16px 0";

    this.node.parentNode?.prepend(wrapperEl);
  }
}
