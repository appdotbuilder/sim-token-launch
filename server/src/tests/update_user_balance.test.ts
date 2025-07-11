
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, tokensTable, userTokenBalancesTable } from '../db/schema';
import { type UpdateUserBalanceInput, type CreateUserInput, type CreateTokenInput } from '../schema';
import { updateUserBalance } from '../handlers/update_user_balance';
import { eq, and } from 'drizzle-orm';

describe('updateUserBalance', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should update user credits balance', async () => {
    // Create test user
    const userResult = await db.insert(usersTable)
      .values({
        username: 'testuser',
        email: 'test@example.com',
        credits_balance: '1000'
      })
      .returning()
      .execute();

    const user = userResult[0];

    const input: UpdateUserBalanceInput = {
      user_id: user.id,
      credits_balance: 2500
    };

    const result = await updateUserBalance(input);

    expect(result.id).toEqual(user.id);
    expect(result.credits_balance).toEqual(2500);
    expect(result.username).toEqual('testuser');
    expect(result.email).toEqual('test@example.com');
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should update token balances for existing balance', async () => {
    // Create test user
    const userResult = await db.insert(usersTable)
      .values({
        username: 'testuser',
        email: 'test@example.com',
        credits_balance: '1000'
      })
      .returning()
      .execute();

    const user = userResult[0];

    // Create test token
    const tokenResult = await db.insert(tokensTable)
      .values({
        name: 'Test Token',
        symbol: 'TEST',
        description: 'Test token',
        initial_supply: '1000000',
        current_supply: '1000000',
        creator_id: user.id
      })
      .returning()
      .execute();

    const token = tokenResult[0];

    // Create existing token balance
    await db.insert(userTokenBalancesTable)
      .values({
        user_id: user.id,
        token_id: token.id,
        balance: '100'
      })
      .execute();

    const input: UpdateUserBalanceInput = {
      user_id: user.id,
      token_balances: [
        { token_id: token.id, balance: 500 }
      ]
    };

    const result = await updateUserBalance(input);

    expect(result.id).toEqual(user.id);

    // Check token balance was updated
    const tokenBalances = await db.select()
      .from(userTokenBalancesTable)
      .where(and(
        eq(userTokenBalancesTable.user_id, user.id),
        eq(userTokenBalancesTable.token_id, token.id)
      ))
      .execute();

    expect(tokenBalances).toHaveLength(1);
    expect(parseFloat(tokenBalances[0].balance)).toEqual(500);
  });

  it('should create new token balance if none exists', async () => {
    // Create test user
    const userResult = await db.insert(usersTable)
      .values({
        username: 'testuser',
        email: 'test@example.com',
        credits_balance: '1000'
      })
      .returning()
      .execute();

    const user = userResult[0];

    // Create test token
    const tokenResult = await db.insert(tokensTable)
      .values({
        name: 'Test Token',
        symbol: 'TEST',
        description: 'Test token',
        initial_supply: '1000000',
        current_supply: '1000000',
        creator_id: user.id
      })
      .returning()
      .execute();

    const token = tokenResult[0];

    const input: UpdateUserBalanceInput = {
      user_id: user.id,
      token_balances: [
        { token_id: token.id, balance: 300 }
      ]
    };

    const result = await updateUserBalance(input);

    expect(result.id).toEqual(user.id);

    // Check new token balance was created
    const tokenBalances = await db.select()
      .from(userTokenBalancesTable)
      .where(and(
        eq(userTokenBalancesTable.user_id, user.id),
        eq(userTokenBalancesTable.token_id, token.id)
      ))
      .execute();

    expect(tokenBalances).toHaveLength(1);
    expect(parseFloat(tokenBalances[0].balance)).toEqual(300);
  });

  it('should update both credits and token balances', async () => {
    // Create test user
    const userResult = await db.insert(usersTable)
      .values({
        username: 'testuser',
        email: 'test@example.com',
        credits_balance: '1000'
      })
      .returning()
      .execute();

    const user = userResult[0];

    // Create test token
    const tokenResult = await db.insert(tokensTable)
      .values({
        name: 'Test Token',
        symbol: 'TEST',
        description: 'Test token',
        initial_supply: '1000000',
        current_supply: '1000000',
        creator_id: user.id
      })
      .returning()
      .execute();

    const token = tokenResult[0];

    const input: UpdateUserBalanceInput = {
      user_id: user.id,
      credits_balance: 1500,
      token_balances: [
        { token_id: token.id, balance: 750 }
      ]
    };

    const result = await updateUserBalance(input);

    expect(result.id).toEqual(user.id);
    expect(result.credits_balance).toEqual(1500);

    // Check token balance was created
    const tokenBalances = await db.select()
      .from(userTokenBalancesTable)
      .where(and(
        eq(userTokenBalancesTable.user_id, user.id),
        eq(userTokenBalancesTable.token_id, token.id)
      ))
      .execute();

    expect(tokenBalances).toHaveLength(1);
    expect(parseFloat(tokenBalances[0].balance)).toEqual(750);
  });

  it('should handle multiple token balances', async () => {
    // Create test user
    const userResult = await db.insert(usersTable)
      .values({
        username: 'testuser',
        email: 'test@example.com',
        credits_balance: '1000'
      })
      .returning()
      .execute();

    const user = userResult[0];

    // Create test tokens
    const token1Result = await db.insert(tokensTable)
      .values({
        name: 'Token 1',
        symbol: 'TOK1',
        description: 'First token',
        initial_supply: '1000000',
        current_supply: '1000000',
        creator_id: user.id
      })
      .returning()
      .execute();

    const token2Result = await db.insert(tokensTable)
      .values({
        name: 'Token 2',
        symbol: 'TOK2',
        description: 'Second token',
        initial_supply: '1000000',
        current_supply: '1000000',
        creator_id: user.id
      })
      .returning()
      .execute();

    const token1 = token1Result[0];
    const token2 = token2Result[0];

    const input: UpdateUserBalanceInput = {
      user_id: user.id,
      token_balances: [
        { token_id: token1.id, balance: 200 },
        { token_id: token2.id, balance: 300 }
      ]
    };

    const result = await updateUserBalance(input);

    expect(result.id).toEqual(user.id);

    // Check both token balances were created
    const tokenBalances = await db.select()
      .from(userTokenBalancesTable)
      .where(eq(userTokenBalancesTable.user_id, user.id))
      .execute();

    expect(tokenBalances).toHaveLength(2);
    
    const token1Balance = tokenBalances.find(b => b.token_id === token1.id);
    const token2Balance = tokenBalances.find(b => b.token_id === token2.id);
    
    expect(parseFloat(token1Balance!.balance)).toEqual(200);
    expect(parseFloat(token2Balance!.balance)).toEqual(300);
  });

  it('should throw error for non-existent user', async () => {
    const input: UpdateUserBalanceInput = {
      user_id: 999,
      credits_balance: 1000
    };

    await expect(updateUserBalance(input)).rejects.toThrow(/User not found/i);
  });
});
