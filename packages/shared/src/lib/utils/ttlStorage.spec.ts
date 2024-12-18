import { TTLStorage } from './TTLStorage';

describe('TTLStorage', () => {
  let ttlStorage: TTLStorage;
  let mockStorage: jest.Mocked<Storage>;

  beforeEach(() => {
    // Mock localStorage behavior
    mockStorage = {
      getItem: jest.fn(),
      setItem: jest.fn(),
      removeItem: jest.fn(),
      clear: jest.fn(),
      key: jest.fn(),
      length: 0,
    };
    ttlStorage = new TTLStorage(mockStorage);
    jest.useFakeTimers(); // To manipulate Date.now() and TTL behavior
  });

  afterEach(() => {
    jest.clearAllMocks();
    jest.useRealTimers();
  });

  it('should store an item with a TTL', () => {
    const key = 'testKey';
    const value = { data: 'testValue' };
    const ttl = 1000; // 1 second

    ttlStorage.setItem(key, value, ttl);

    // Parse the argument for stricter testing
    const [, savedValue] = mockStorage.setItem.mock.calls[0];
    const parsed = JSON.parse(savedValue);
    expect(parsed).toEqual({
      value,
      cat: expect.any(Number),
      ttl,
    });
  });

  it('should retrieve an unexpired item', () => {
    const key = 'testKey';
    const value = { data: 'testValue' };
    const now = Date.now();
    mockStorage.getItem.mockReturnValue(
      JSON.stringify({ value, cat: now, ttl: 1000 })
    );

    jest.spyOn(global.Date, 'now').mockImplementation(() => now + 500); // 500ms later

    const result = ttlStorage.getItem<typeof value>(key);
    expect(result).toEqual(value);
  });

  it('should return null for an expired item and remove it', () => {
    const key = 'testKey';
    const value = { data: 'testValue' };
    const now = Date.now();
    mockStorage.getItem.mockReturnValue(
      JSON.stringify({ value, cat: now, ttl: 1000 })
    );

    jest.spyOn(global.Date, 'now').mockImplementation(() => now + 1500); // 1.5 seconds later

    const result = ttlStorage.getItem<typeof value>(key);

    expect(result).toBeNull();
    expect(mockStorage.removeItem).toHaveBeenCalledWith(key);
  });

  it('should retrieve an item ignoring TTL when ignoreTtl is true', () => {
    const key = 'testKey';
    const value = { data: 'testValue' };
    const now = Date.now();
    mockStorage.getItem.mockReturnValue(
      JSON.stringify({ value, cat: now, ttl: 1000 })
    );

    jest.spyOn(global.Date, 'now').mockImplementation(() => now + 1500); // Item expired

    const result = ttlStorage.getItem<typeof value>(key, true);

    expect(result).toEqual(value);
    expect(mockStorage.removeItem).not.toHaveBeenCalled();
  });

  it('should update the TTL of an existing item', () => {
    const key = 'testKey';
    const value = { data: 'testValue' };
    const now = Date.now();
    mockStorage.getItem.mockReturnValue(
      JSON.stringify({ value, cat: now, ttl: 1000 })
    );

    jest.spyOn(global.Date, 'now').mockImplementation(() => now + 500); // 500ms later

    const result = ttlStorage.updateExpiry(key, 2000);

    expect(result).toBe(true);
    expect(mockStorage.setItem).toHaveBeenCalledWith(
      key,
      JSON.stringify({ value, cat: now + 500, ttl: 2000 })
    );
  });

  it('should fail to update TTL for an expired or missing item', () => {
    const key = 'testKey';
    const value = { data: 'testValue' };
    const now = Date.now();

    // Case 1: Missing item
    mockStorage.getItem.mockReturnValue(null);
    let result = ttlStorage.updateExpiry(key, 2000);
    expect(result).toBe(false);

    // Case 2: Expired item
    mockStorage.getItem.mockReturnValue(
      JSON.stringify({ value, cat: now, ttl: 1000 })
    );
    jest.spyOn(global.Date, 'now').mockImplementation(() => now + 1500); // 1.5 seconds later

    result = ttlStorage.updateExpiry(key, 2000);
    expect(result).toBe(false);
    expect(mockStorage.removeItem).toHaveBeenCalledWith(key);
  });

  it('should remove an item', () => {
    const key = 'testKey';
    ttlStorage.removeItem(key);
    expect(mockStorage.removeItem).toHaveBeenCalledWith(key);
  });

  it('should clear all items from storage', () => {
    ttlStorage.clear();
    expect(mockStorage.clear).toHaveBeenCalled();
  });
});
