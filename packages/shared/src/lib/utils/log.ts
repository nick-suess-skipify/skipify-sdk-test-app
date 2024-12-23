import { Environment } from "../constants";

export function log(...args: unknown[]) {
  if (['development', 'staging'].includes(Environment)) {
    const timestamp = new Date().toISOString();
    console.log(`[Skipify SDK | ${timestamp}]`, ...args);
  }
}
