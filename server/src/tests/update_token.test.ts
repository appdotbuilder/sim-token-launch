
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, tokensTable } from '../db/schema';
import { type UpdateTokenInput, type CreateUserInput } from '../schema';
import { updateToken } from '../handlers/update_token';
import { eq } from 'drizzle-orm';

// Test user data
const testUser: CreateUserInput = {
  username: 'testuser',
  email: 'test@example.com',
  credits_balance: 1000,
  is_admin: false
};

describe('updateToken', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should update token name', async () => {
    // Create test user
    const userResult = await db.insert(usersTable)
      .values({
        ...testUser,
        credits_balance: testUser.credits_balance!.toString()
      })
      .returning()
      .execute();

    // Create test token
    const tokenResult = await db.insert(tokensTable)
      .values({
        name: 'Original Token',
        symbol: 'ORIG',
        description: 'Original description',
        initial_supply: '1000000',
        current_supply: '1000000',
        current_price: '1.0',
        creator_id: userResult[0].id,
        status: 'active'
      })
      .returning()
      .execute();

    const updateInput: UpdateTokenInput = {
      id: tokenResult[0].id,
      name: 'Updated Token Name'
    };

    const result = await updateToken(updateInput);

    expect(result.name).toEqual('Updated Token Name');
    expect(result.symbol).toEqual('ORIG'); // Unchanged
    expect(result.description).toEqual('Original description'); // Unchanged
    expect(result.status).toEqual('active'); // Unchanged
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should update token symbol', async () => {
    // Create test user
    const userResult = await db.insert(usersTable)
      .values({
        ...testUser,
        credits_balance: testUser.credits_balance!.toString()
      })
      .returning()
      .execute();

    // Create test token
    const tokenResult = await db.insert(tokensTable)
      .values({
        name: 'Test Token',
        symbol: 'TEST',
        description: 'Test description',
        initial_supply: '1000000',
        current_supply: '1000000',
        current_price: '1.0',
        creator_id: userResult[0].id,
        status: 'active'
      })
      .returning()
      .execute();

    const updateInput: UpdateTokenInput = {
      id: tokenResult[0].id,
      symbol: 'UPDATED'
    };

    const result = await updateToken(updateInput);

    expect(result.symbol).toEqual('UPDATED');
    expect(result.name).toEqual('Test Token'); // Unchanged
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should update token status', async () => {
    // Create test user
    const userResult = await db.insert(usersTable)
      .values({
        ...testUser,
        credits_balance: testUser.credits_balance!.toString()
      })
      .returning()
      .execute();

    // Create test token
    const tokenResult = await db.insert(tokensTable)
      .values({
        name: 'Test Token',
        symbol: 'TEST',
        description: 'Test description',
        initial_supply: '1000000',
        current_supply: '1000000',
        current_price: '1.0',
        creator_id: userResult[0].id,
        status: 'active'
      })
      .returning()
      .execute();

    const updateInput: UpdateTokenInput = {
      id: tokenResult[0].id,
      status: 'paused'
    };

    const result = await updateToken(updateInput);

    expect(result.status).toEqual('paused');
    expect(result.name).toEqual('Test Token'); // Unchanged
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should update multiple fields at once', async () => {
    // Create test user
    const userResult = await db.insert(usersTable)
      .values({
        ...testUser,
        credits_balance: testUser.credits_balance!.toString()
      })
      .returning()
      .execute();

    // Create test token
    const tokenResult = await db.insert(tokensTable)
      .values({
        name: 'Original Token',
        symbol: 'ORIG',
        description: 'Original description',
        initial_supply: '1000000',
        current_supply: '1000000',
        current_price: '1.0',
        creator_id: userResult[0].id,
        status: 'active'
      })
      .returning()
      .execute();

    const updateInput: UpdateTokenInput = {
      id: tokenResult[0].id,
      name: 'Updated Token',
      symbol: 'UPD',
      description: 'Updated description',
      status: 'inactive'
    };

    const result = await updateToken(updateInput);

    expect(result.name).toEqual('Updated Token');
    expect(result.symbol).toEqual('UPD');
    expect(result.description).toEqual('Updated description');
    expect(result.status).toEqual('inactive');
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should update token description to null', async () => {
    // Create test user
    const userResult = await db.insert(usersTable)
      .values({
        ...testUser,
        credits_balance: testUser.credits_balance!.toString()
      })
      .returning()
      .execute();

    // Create test token
    const tokenResult = await db.insert(tokensTable)
      .values({
        name: 'Test Token',
        symbol: 'TEST',
        description: 'Original description',
        initial_supply: '1000000',
        current_supply: '1000000',
        current_price: '1.0',
        creator_id: userResult[0].id,
        status: 'active'
      })
      .returning()
      .execute();

    const updateInput: UpdateTokenInput = {
      id: tokenResult[0].id,
      description: null
    };

    const result = await updateToken(updateInput);

    expect(result.description).toBeNull();
    expect(result.name).toEqual('Test Token'); // Unchanged
  });

  it('should save updates to database', async () => {
    // Create test user
    const userResult = await db.insert(usersTable)
      .values({
        ...testUser,
        credits_balance: testUser.credits_balance!.toString()
      })
      .returning()
      .execute();

    // Create test token
    const tokenResult = await db.insert(tokensTable)
      .values({
        name: 'Original Token',
        symbol: 'ORIG',
        description: 'Original description',
        initial_supply: '1000000',
        current_supply: '1000000',
        current_price: '1.0',
        creator_id: userResult[0].id,
        status: 'active'
      })
      .returning()
      .execute();

    const updateInput: UpdateTokenInput = {
      id: tokenResult[0].id,
      name: 'Database Test Token',
      status: 'paused'
    };

    await updateToken(updateInput);

    // Verify changes were saved to database
    const tokens = await db.select()
      .from(tokensTable)
      .where(eq(tokensTable.id, tokenResult[0].id))
      .execute();

    expect(tokens).toHaveLength(1);
    expect(tokens[0].name).toEqual('Database Test Token');
    expect(tokens[0].status).toEqual('paused');
    expect(tokens[0].description).toEqual('Original description'); // Unchanged
  });

  it('should throw error for non-existent token', async () => {
    const updateInput: UpdateTokenInput = {
      id: 999999,
      name: 'Non-existent Token'
    };

    await expect(updateToken(updateInput)).rejects.toThrow(/Token not found/i);
  });

  it('should preserve numeric field types', async () => {
    // Create test user
    const userResult = await db.insert(usersTable)
      .values({
        ...testUser,
        credits_balance: testUser.credits_balance!.toString()
      })
      .returning()
      .execute();

    // Create test token
    const tokenResult = await db.insert(tokensTable)
      .values({
        name: 'Test Token',
        symbol: 'TEST',
        description: 'Test description',
        initial_supply: '1500000',
        current_supply: '1200000',
        current_price: '2.5',
        creator_id: userResult[0].id,
        status: 'active'
      })
      .returning()
      .execute();

    const updateInput: UpdateTokenInput = {
      id: tokenResult[0].id,
      name: 'Type Test Token'
    };

    const result = await updateToken(updateInput);

    // Verify numeric fields are properly converted
    expect(typeof result.initial_supply).toBe('number');
    expect(typeof result.current_supply).toBe('number');
    expect(typeof result.current_price).toBe('number');
    expect(result.initial_supply).toEqual(1500000);
    expect(result.current_supply).toEqual(1200000);
    expect(result.current_price).toEqual(2.5);
  });
});
