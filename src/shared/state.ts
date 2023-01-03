import create from "zustand/vanilla";
import { persist } from "zustand/middleware";

export const defaultState = {
  enrollmentCheckboxValue: true,
  userEmail: "",
  isExistingUser: true,
};

export const store = create(
  persist(() => ({
    /**
     * These values are persisted on page changes,
     * so we can carry data from the checkout to the order confirmation page
     */
    ...defaultState,
  }))
);
