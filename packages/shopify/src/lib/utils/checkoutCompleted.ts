type Props = {
    launchEnrollmentIframe: () => void;
};

export class CheckoutCompleted {
    launchEnrollmentIframe: () => void;

    constructor({ launchEnrollmentIframe }: Props) {
        this.launchEnrollmentIframe = launchEnrollmentIframe;
        this.start();
    }

    start() {
        this.launchEnrollmentIframe();
    }
}
