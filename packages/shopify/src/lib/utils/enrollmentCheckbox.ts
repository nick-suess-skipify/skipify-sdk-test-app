import { SkipifyElementIds, SdkUrl } from "@checkout-sdk/shared";
interface OwnProps {
  node: HTMLElement;
  // choose depend on the reference node
  injectMethod: "prepend" | "insertBefore";
}

type Props = OwnProps;

export class EnrollmentCheckbox {
  node: HTMLElement;
  injectMethod: "prepend" | "insertBefore";
  constructor({ node, injectMethod }: Props) {
    this.node = node;
    this.injectMethod = injectMethod || "prepend";
    this.start();
  }

  start() {
    const wrapperEl = document.createElement("div");
    wrapperEl.id = SkipifyElementIds.enrollmentCheckbox;
    wrapperEl.style.marginTop = "10px";

    const enrollmentCheckboxFrame = document.createElement("iframe");
    enrollmentCheckboxFrame.src = `${SdkUrl}/shared/components/iframe_enrollmentCheckbox.html?date=${new Date().getTime()}`;
    enrollmentCheckboxFrame.id = `${SkipifyElementIds.enrollmentCheckbox}_frame`;

    wrapperEl.appendChild(enrollmentCheckboxFrame);

    if (this.injectMethod === "prepend") {
      this.node.parentNode?.prepend(wrapperEl);
    } else if (this.injectMethod === "insertBefore") {
      this.node.parentNode?.parentNode?.insertBefore(
        wrapperEl,
        this.node.parentNode
      );
    }
  }
}
