
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, tokensTable, transactionsTable } from '../db/schema';
import { type GetUserTransactionsInput } from '../schema';
import { getUserTransactions } from '../handlers/get_user_transactions';

describe('getUserTransactions', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when user has no transactions', async () => {
    // Create a user with no transactions
    const userResult = await db.insert(usersTable)
      .values({
        username: 'testuser',
        email: 'test@example.com',
        credits_balance: '1000',
        is_admin: false
      })
      .returning()
      .execute();

    const input: GetUserTransactionsInput = {
      user_id: userResult[0].id
    };

    const result = await getUserTransactions(input);

    expect(result).toEqual([]);
  });

  it('should return user transactions ordered by date descending', async () => {
    // Create prerequisite data
    const userResult = await db.insert(usersTable)
      .values({
        username: 'testuser',
        email: 'test@example.com',
        credits_balance: '1000',
        is_admin: false
      })
      .returning()
      .execute();

    const tokenResult = await db.insert(tokensTable)
      .values({
        name: 'Test Token',
        symbol: 'TEST',
        description: 'A test token',
        initial_supply: '1000000',
        current_supply: '1000000',
        current_price: '1.0',
        creator_id: userResult[0].id,
        status: 'active'
      })
      .returning()
      .execute();

    // Create transactions with different timestamps
    const transaction1 = await db.insert(transactionsTable)
      .values({
        user_id: userResult[0].id,
        token_id: tokenResult[0].id,
        transaction_type: 'buy',
        amount: '100',
        price_per_token: '1.0',
        total_cost: '100',
        credits_change: '-100'
      })
      .returning()
      .execute();

    // Wait to ensure different timestamps
    await new Promise(resolve => setTimeout(resolve, 10));

    const transaction2 = await db.insert(transactionsTable)
      .values({
        user_id: userResult[0].id,
        token_id: tokenResult[0].id,
        transaction_type: 'sell',
        amount: '50',
        price_per_token: '1.5',
        total_cost: '75',
        credits_change: '75'
      })
      .returning()
      .execute();

    const input: GetUserTransactionsInput = {
      user_id: userResult[0].id
    };

    const result = await getUserTransactions(input);

    expect(result).toHaveLength(2);
    
    // Verify ordering (most recent first)
    expect(result[0].id).toEqual(transaction2[0].id);
    expect(result[1].id).toEqual(transaction1[0].id);
    
    // Verify numeric conversions
    expect(typeof result[0].amount).toBe('number');
    expect(typeof result[0].price_per_token).toBe('number');
    expect(typeof result[0].total_cost).toBe('number');
    expect(typeof result[0].credits_change).toBe('number');
    
    // Verify field values
    expect(result[0].transaction_type).toEqual('sell');
    expect(result[0].amount).toEqual(50);
    expect(result[0].price_per_token).toEqual(1.5);
    expect(result[0].total_cost).toEqual(75);
    expect(result[0].credits_change).toEqual(75);
    
    expect(result[1].transaction_type).toEqual('buy');
    expect(result[1].amount).toEqual(100);
    expect(result[1].price_per_token).toEqual(1.0);
    expect(result[1].total_cost).toEqual(100);
    expect(result[1].credits_change).toEqual(-100);
  });

  it('should filter transactions by token_id when provided', async () => {
    // Create prerequisite data
    const userResult = await db.insert(usersTable)
      .values({
        username: 'testuser',
        email: 'test@example.com',
        credits_balance: '1000',
        is_admin: false
      })
      .returning()
      .execute();

    const token1Result = await db.insert(tokensTable)
      .values({
        name: 'Test Token 1',
        symbol: 'TEST1',
        description: 'First test token',
        initial_supply: '1000000',
        current_supply: '1000000',
        current_price: '1.0',
        creator_id: userResult[0].id,
        status: 'active'
      })
      .returning()
      .execute();

    const token2Result = await db.insert(tokensTable)
      .values({
        name: 'Test Token 2',
        symbol: 'TEST2',
        description: 'Second test token',
        initial_supply: '2000000',
        current_supply: '2000000',
        current_price: '2.0',
        creator_id: userResult[0].id,
        status: 'active'
      })
      .returning()
      .execute();

    // Create transactions for both tokens
    await db.insert(transactionsTable)
      .values({
        user_id: userResult[0].id,
        token_id: token1Result[0].id,
        transaction_type: 'buy',
        amount: '100',
        price_per_token: '1.0',
        total_cost: '100',
        credits_change: '-100'
      })
      .execute();

    await db.insert(transactionsTable)
      .values({
        user_id: userResult[0].id,
        token_id: token2Result[0].id,
        transaction_type: 'buy',
        amount: '50',
        price_per_token: '2.0',
        total_cost: '100',
        credits_change: '-100'
      })
      .execute();

    const input: GetUserTransactionsInput = {
      user_id: userResult[0].id,
      token_id: token1Result[0].id
    };

    const result = await getUserTransactions(input);

    expect(result).toHaveLength(1);
    expect(result[0].token_id).toEqual(token1Result[0].id);
    expect(result[0].amount).toEqual(100);
    expect(result[0].price_per_token).toEqual(1.0);
  });

  it('should return empty array when filtering by non-existent token', async () => {
    // Create prerequisite data
    const userResult = await db.insert(usersTable)
      .values({
        username: 'testuser',
        email: 'test@example.com',
        credits_balance: '1000',
        is_admin: false
      })
      .returning()
      .execute();

    const input: GetUserTransactionsInput = {
      user_id: userResult[0].id,
      token_id: 999999 // Non-existent token
    };

    const result = await getUserTransactions(input);

    expect(result).toEqual([]);
  });

  it('should only return transactions for the specified user', async () => {
    // Create two users
    const user1Result = await db.insert(usersTable)
      .values({
        username: 'user1',
        email: 'user1@example.com',
        credits_balance: '1000',
        is_admin: false
      })
      .returning()
      .execute();

    const user2Result = await db.insert(usersTable)
      .values({
        username: 'user2',
        email: 'user2@example.com',
        credits_balance: '1000',
        is_admin: false
      })
      .returning()
      .execute();

    const tokenResult = await db.insert(tokensTable)
      .values({
        name: 'Test Token',
        symbol: 'TEST',
        description: 'A test token',
        initial_supply: '1000000',
        current_supply: '1000000',
        current_price: '1.0',
        creator_id: user1Result[0].id,
        status: 'active'
      })
      .returning()
      .execute();

    // Create transactions for both users
    await db.insert(transactionsTable)
      .values({
        user_id: user1Result[0].id,
        token_id: tokenResult[0].id,
        transaction_type: 'buy',
        amount: '100',
        price_per_token: '1.0',
        total_cost: '100',
        credits_change: '-100'
      })
      .execute();

    await db.insert(transactionsTable)
      .values({
        user_id: user2Result[0].id,
        token_id: tokenResult[0].id,
        transaction_type: 'buy',
        amount: '50',
        price_per_token: '1.0',
        total_cost: '50',
        credits_change: '-50'
      })
      .execute();

    const input: GetUserTransactionsInput = {
      user_id: user1Result[0].id
    };

    const result = await getUserTransactions(input);

    expect(result).toHaveLength(1);
    expect(result[0].user_id).toEqual(user1Result[0].id);
    expect(result[0].amount).toEqual(100);
  });
});
