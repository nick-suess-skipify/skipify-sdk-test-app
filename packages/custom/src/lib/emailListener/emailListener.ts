import { SkipifyClassNames } from '@checkout-sdk/shared';
import { nanoid } from 'nanoid'
import debounce from 'debounce';
import { Config, AdditionalOptions } from '../config';

type LookupUserType = (email: string, listenerId: string) => void;

export class EmailListener {
  id: string;
  node: HTMLInputElement | null = null;
  lookupUser: LookupUserType;
  constructor(private config: Config, public merchantRef: string, lookupUser: LookupUserType, public options?: AdditionalOptions) {
    this.id = nanoid();
    this.lookupUser = lookupUser;
  }

  enable(elem: HTMLInputElement) {
    if (!elem || !(elem instanceof HTMLInputElement)) {
      console.error(
        'Skipify: Invalid target. Email input field must be an HTMLInputElement.'
      );
    }
    this.node = elem;
    this.node.classList.add(SkipifyClassNames.emailInput);
    this.node.addEventListener('input', debounce((e: Event) => this.onChange(e), 400));
  }

  onChange(e: Event) {
    const emailValue = (e.target as HTMLInputElement).value;
    if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailValue)) {
      const cleanedEmail = emailValue.trim().toLowerCase();
      this.lookupUser(cleanedEmail, this.id)
    }
  }
}
