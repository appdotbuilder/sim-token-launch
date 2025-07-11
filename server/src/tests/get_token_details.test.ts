
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, tokensTable } from '../db/schema';
import { type GetTokenDetailsInput, type CreateUserInput, type CreateTokenInput } from '../schema';
import { getTokenDetails } from '../handlers/get_token_details';

// Test data
const testUser: CreateUserInput = {
  username: 'testuser',
  email: 'test@example.com',
  credits_balance: 1000,
  is_admin: false
};

const testToken: CreateTokenInput = {
  name: 'Test Token',
  symbol: 'TEST',
  description: 'A test token',
  initial_supply: 1000000,
  creator_id: 1 // Will be set after user creation
};

describe('getTokenDetails', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return token details when token exists', async () => {
    // Create user first
    const userResult = await db.insert(usersTable)
      .values({
        username: testUser.username,
        email: testUser.email,
        credits_balance: testUser.credits_balance.toString(),
        is_admin: testUser.is_admin
      })
      .returning()
      .execute();

    // Create token
    const tokenResult = await db.insert(tokensTable)
      .values({
        name: testToken.name,
        symbol: testToken.symbol,
        description: testToken.description,
        initial_supply: testToken.initial_supply.toString(),
        current_supply: testToken.initial_supply.toString(),
        current_price: '1.0',
        creator_id: userResult[0].id
      })
      .returning()
      .execute();

    const input: GetTokenDetailsInput = {
      token_id: tokenResult[0].id
    };

    const result = await getTokenDetails(input);

    expect(result).not.toBeNull();
    expect(result!.id).toEqual(tokenResult[0].id);
    expect(result!.name).toEqual('Test Token');
    expect(result!.symbol).toEqual('TEST');
    expect(result!.description).toEqual('A test token');
    expect(result!.initial_supply).toEqual(1000000);
    expect(result!.current_supply).toEqual(1000000);
    expect(result!.current_price).toEqual(1.0);
    expect(result!.creator_id).toEqual(userResult[0].id);
    expect(result!.status).toEqual('active');
    expect(result!.created_at).toBeInstanceOf(Date);
    expect(result!.updated_at).toBeInstanceOf(Date);

    // Verify numeric types
    expect(typeof result!.initial_supply).toBe('number');
    expect(typeof result!.current_supply).toBe('number');
    expect(typeof result!.current_price).toBe('number');
  });

  it('should return null when token does not exist', async () => {
    const input: GetTokenDetailsInput = {
      token_id: 999
    };

    const result = await getTokenDetails(input);

    expect(result).toBeNull();
  });

  it('should handle token with null description', async () => {
    // Create user first
    const userResult = await db.insert(usersTable)
      .values({
        username: testUser.username,
        email: testUser.email,
        credits_balance: testUser.credits_balance.toString(),
        is_admin: testUser.is_admin
      })
      .returning()
      .execute();

    // Create token with null description
    const tokenResult = await db.insert(tokensTable)
      .values({
        name: 'Null Description Token',
        symbol: 'NULL',
        description: null,
        initial_supply: '500000',
        current_supply: '500000',
        current_price: '2.5',
        creator_id: userResult[0].id
      })
      .returning()
      .execute();

    const input: GetTokenDetailsInput = {
      token_id: tokenResult[0].id
    };

    const result = await getTokenDetails(input);

    expect(result).not.toBeNull();
    expect(result!.description).toBeNull();
    expect(result!.name).toEqual('Null Description Token');
    expect(result!.symbol).toEqual('NULL');
    expect(result!.initial_supply).toEqual(500000);
    expect(result!.current_price).toEqual(2.5);
  });
});
