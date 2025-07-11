
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { tokensTable, usersTable } from '../db/schema';
import { type CreateTokenInput } from '../schema';
import { createToken } from '../handlers/create_token';
import { eq } from 'drizzle-orm';

describe('createToken', () => {
  let testUserId: number;

  beforeEach(async () => {
    await createDB();
    
    // Create test user first
    const userResult = await db.insert(usersTable)
      .values({
        username: 'testuser',
        email: 'test@example.com',
        credits_balance: '1000',
        is_admin: false
      })
      .returning()
      .execute();
    
    testUserId = userResult[0].id;
  });

  afterEach(resetDB);

  const testInput: CreateTokenInput = {
    name: 'Test Token',
    symbol: 'TEST',
    description: 'A token for testing',
    initial_supply: 1000000,
    creator_id: 0 // Will be set in tests
  };

  it('should create a token with valid input', async () => {
    const input = { ...testInput, creator_id: testUserId };
    const result = await createToken(input);

    // Basic field validation
    expect(result.name).toEqual('Test Token');
    expect(result.symbol).toEqual('TEST');
    expect(result.description).toEqual('A token for testing');
    expect(result.initial_supply).toEqual(1000000);
    expect(result.current_supply).toEqual(1000000);
    expect(result.current_price).toEqual(1.0);
    expect(result.creator_id).toEqual(testUserId);
    expect(result.status).toEqual('active');
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);

    // Verify numeric types
    expect(typeof result.initial_supply).toBe('number');
    expect(typeof result.current_supply).toBe('number');
    expect(typeof result.current_price).toBe('number');
  });

  it('should save token to database', async () => {
    const input = { ...testInput, creator_id: testUserId };
    const result = await createToken(input);

    // Query database to verify token was saved
    const tokens = await db.select()
      .from(tokensTable)
      .where(eq(tokensTable.id, result.id))
      .execute();

    expect(tokens).toHaveLength(1);
    expect(tokens[0].name).toEqual('Test Token');
    expect(tokens[0].symbol).toEqual('TEST');
    expect(tokens[0].description).toEqual('A token for testing');
    expect(parseFloat(tokens[0].initial_supply)).toEqual(1000000);
    expect(parseFloat(tokens[0].current_supply)).toEqual(1000000);
    expect(parseFloat(tokens[0].current_price)).toEqual(1.0);
    expect(tokens[0].creator_id).toEqual(testUserId);
    expect(tokens[0].status).toEqual('active');
    expect(tokens[0].created_at).toBeInstanceOf(Date);
    expect(tokens[0].updated_at).toBeInstanceOf(Date);
  });

  it('should throw error for non-existent creator', async () => {
    const input = { ...testInput, creator_id: 99999 };
    
    await expect(createToken(input)).rejects.toThrow(/creator user not found/i);
  });

  it('should handle null description', async () => {
    const input = { ...testInput, creator_id: testUserId, description: null };
    const result = await createToken(input);

    expect(result.description).toBeNull();
  });

  it('should set current_supply equal to initial_supply', async () => {
    const input = { ...testInput, creator_id: testUserId, initial_supply: 5000000 };
    const result = await createToken(input);

    expect(result.initial_supply).toEqual(5000000);
    expect(result.current_supply).toEqual(5000000);
  });

  it('should enforce unique symbol constraint', async () => {
    const input = { ...testInput, creator_id: testUserId };
    
    // Create first token
    await createToken(input);
    
    // Try to create second token with same symbol
    await expect(createToken(input)).rejects.toThrow();
  });
});
