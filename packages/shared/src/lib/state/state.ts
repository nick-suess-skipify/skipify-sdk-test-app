import create from "zustand/vanilla";
import { persist } from "zustand/middleware";

export const defaultState = {
  enrollmentCheckboxValue: true,
  userEmail: "",
  eligible: false,
  testMode: true,
  emailWhitelisted: false,
};

export const store = create(
  persist(() => ({
    /**
     * These values are persisted on page changes,
     * so we can carry data from the checkout to the order confirmation page
     */
    ...defaultState,
  }), {name: 'skipify_checkout'})
);
