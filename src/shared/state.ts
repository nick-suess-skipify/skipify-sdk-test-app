import create from "zustand/vanilla";
import { persist } from "zustand/middleware";

export const store = create(
  persist(() => ({
    /**
     * This value should be persisted on page changes,
     * so we can carry the enrollmentCheckboxValue from the checkout to the order confirmation page
     */
    enrollmentCheckboxValue: true,
  }))
);
