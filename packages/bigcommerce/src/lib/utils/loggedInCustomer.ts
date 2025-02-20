import { SkipifyClassNames } from '@checkout-sdk/shared';

interface OwnProps {
    node: Element;
    fetchUserEmailFromCart: () => void;
}

type Props = OwnProps;

export class LoggedInCustomer {
    node: Element;
    fetchUserEmailFromCart: () => void;

    constructor({ node, fetchUserEmailFromCart }: Props) {
        this.node = node;
        this.fetchUserEmailFromCart = fetchUserEmailFromCart;
        this.start();
    }

    start() {
        this.node.classList.add(SkipifyClassNames.loggedInCustomer);
        this.fetchUserEmailFromCart();
    }
}
