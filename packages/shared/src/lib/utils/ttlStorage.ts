/**
 * Library to handle storage with TTL
 */
export class TTLStorage {
  private storage: Storage;

  constructor(storage = localStorage) {
    this.storage = storage; // Allows flexibility to switch between localStorage and sessionStorage
  }

  /**
   * Sets an item in storage with a TTL.
   * @param key - The key for the item.
   * @param value - The value to store.
   * @param ttl - Time-to-live in milliseconds.
   */
  setItem<T>(key: string, value: T, ttl?: number): void {
    const now = Date.now();
    const item = {
      value,
      cat: now,
      ttl,
    };
    this.storage.setItem(key, JSON.stringify(item));
  }

  /**
   * Retrieves an item from storage if it hasn't expired.
   * If it has expired, it will remove the vlaue from storage.
   * @param key - The key of the item to retrieve.
   * @param ignoreTtl - Ignores TTL and just returns the value if key is found.
   * @returns The stored value or null if expired or not found.
   */
  getItem<T>(key: string, ignoreTtl?: boolean): T | null {
    const itemStr = this.storage.getItem(key);

    if (!itemStr) return null;

    const item: { value: T; cat: number, ttl?: number } = JSON.parse(itemStr);
    const now = Date.now();

    if (ignoreTtl || !item.ttl) return item.value;

    if (now > item.cat + item.ttl) {
      this.storage.removeItem(key);
      return null;
    }

    return item.value;
  }

  /**
   * Updates the expiry of an existing item by updating the cat + ttl.
   * @param key - The key of the item to update.
   * @param ttl - The new time-to-live in milliseconds.
   * @returns True if the item was updated, false if the item doesn't exist, has expire, or has no ttl.
   */
  updateExpiry(key: string, ttl?: number): boolean {
    const itemStr = this.storage.getItem(key);

    if (!itemStr) return false;

    const item: { value: unknown; cat: number, ttl?: number } = JSON.parse(itemStr);
    const now = Date.now();

    if (!item.ttl) return false;

    if (now > item.cat + item.ttl) {
      this.storage.removeItem(key);
      return false;
    }

    // Update the cat + ttl and save the item back to storage
    item.cat = now;
    if (ttl) item.ttl = ttl;
    this.storage.setItem(key, JSON.stringify(item));
    return true;
  }

  /**
   * Removes an item from storage.
   * @param key - The key of the item to remove.
   */
  removeItem(key: string): void {
    this.storage.removeItem(key);
  }

  /**
   * Clears all items in storage.
   */
  clear(): void {
    this.storage.clear();
  }

};
