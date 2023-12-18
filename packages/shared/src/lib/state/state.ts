import { createStore } from 'zustand/vanilla';
import { persist } from 'zustand/middleware';

export type State = {
  enrollmentCheckboxValue: boolean;
  userEmail: string;
  eligible: boolean;
  testMode: boolean;
  emailWhitelisted: boolean;
  flags?: Record<string, unknown>;
};

export const defaultState: State = {
  enrollmentCheckboxValue: true,
  userEmail: '',
  eligible: false,
  testMode: true,
  emailWhitelisted: false,
  flags: undefined,
};

export const store = createStore(
  persist(
    () => ({
      /**
       * These values are persisted on page changes,
       * so we can carry data from the checkout to the order confirmation page
       */
      ...defaultState,
    }),
    { name: 'skipify_checkout' }
  )
);
