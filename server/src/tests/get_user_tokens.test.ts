
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, tokensTable, userTokenBalancesTable } from '../db/schema';
import { type GetUserTokensInput } from '../schema';
import { getUserTokens } from '../handlers/get_user_tokens';

describe('getUserTokens', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return user token balances', async () => {
    // Create test user
    const userResult = await db.insert(usersTable)
      .values({
        username: 'testuser',
        email: 'test@example.com',
        credits_balance: '1000',
        is_admin: false
      })
      .returning()
      .execute();

    const userId = userResult[0].id;

    // Create test token
    const tokenResult = await db.insert(tokensTable)
      .values({
        name: 'Test Token',
        symbol: 'TEST',
        description: 'A test token',
        initial_supply: '1000000',
        current_supply: '1000000',
        current_price: '1.0',
        creator_id: userId,
        status: 'active'
      })
      .returning()
      .execute();

    const tokenId = tokenResult[0].id;

    // Create user token balance
    await db.insert(userTokenBalancesTable)
      .values({
        user_id: userId,
        token_id: tokenId,
        balance: '500.5'
      })
      .execute();

    const input: GetUserTokensInput = {
      user_id: userId
    };

    const result = await getUserTokens(input);

    expect(result).toHaveLength(1);
    expect(result[0].user_id).toEqual(userId);
    expect(result[0].token_id).toEqual(tokenId);
    expect(result[0].balance).toEqual(500.5);
    expect(typeof result[0].balance).toBe('number');
    expect(result[0].id).toBeDefined();
    expect(result[0].created_at).toBeInstanceOf(Date);
    expect(result[0].updated_at).toBeInstanceOf(Date);
  });

  it('should return empty array for user with no tokens', async () => {
    // Create test user
    const userResult = await db.insert(usersTable)
      .values({
        username: 'testuser',
        email: 'test@example.com',
        credits_balance: '1000',
        is_admin: false
      })
      .returning()
      .execute();

    const userId = userResult[0].id;

    const input: GetUserTokensInput = {
      user_id: userId
    };

    const result = await getUserTokens(input);

    expect(result).toHaveLength(0);
  });

  it('should return multiple token balances for user', async () => {
    // Create test user
    const userResult = await db.insert(usersTable)
      .values({
        username: 'testuser',
        email: 'test@example.com',
        credits_balance: '1000',
        is_admin: false
      })
      .returning()
      .execute();

    const userId = userResult[0].id;

    // Create multiple test tokens
    const token1Result = await db.insert(tokensTable)
      .values({
        name: 'Test Token 1',
        symbol: 'TEST1',
        description: 'First test token',
        initial_supply: '1000000',
        current_supply: '1000000',
        current_price: '1.0',
        creator_id: userId,
        status: 'active'
      })
      .returning()
      .execute();

    const token2Result = await db.insert(tokensTable)
      .values({
        name: 'Test Token 2',
        symbol: 'TEST2',
        description: 'Second test token',
        initial_supply: '500000',
        current_supply: '500000',
        current_price: '2.0',
        creator_id: userId,
        status: 'active'
      })
      .returning()
      .execute();

    const token1Id = token1Result[0].id;
    const token2Id = token2Result[0].id;

    // Create user token balances
    await db.insert(userTokenBalancesTable)
      .values([
        {
          user_id: userId,
          token_id: token1Id,
          balance: '100.25'
        },
        {
          user_id: userId,
          token_id: token2Id,
          balance: '75.75'
        }
      ])
      .execute();

    const input: GetUserTokensInput = {
      user_id: userId
    };

    const result = await getUserTokens(input);

    expect(result).toHaveLength(2);
    
    // Check first token balance
    const token1Balance = result.find(b => b.token_id === token1Id);
    expect(token1Balance).toBeDefined();
    expect(token1Balance?.balance).toEqual(100.25);
    expect(typeof token1Balance?.balance).toBe('number');
    
    // Check second token balance
    const token2Balance = result.find(b => b.token_id === token2Id);
    expect(token2Balance).toBeDefined();
    expect(token2Balance?.balance).toEqual(75.75);
    expect(typeof token2Balance?.balance).toBe('number');
  });
});
