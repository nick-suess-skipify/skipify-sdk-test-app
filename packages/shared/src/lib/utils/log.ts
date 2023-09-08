export function log(...args: unknown[]) {
  const timestamp = new Date().toISOString();
  console.log(`[Skipify SDK | ${timestamp}]`, ...args);
}
