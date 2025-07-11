
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, tokensTable, userTokenBalancesTable, transactionsTable } from '../db/schema';
import { type TradeTokenInput } from '../schema';
import { tradeToken } from '../handlers/trade_token';
import { eq, and } from 'drizzle-orm';

describe('tradeToken', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  let testUserId: number;
  let testTokenId: number;

  beforeEach(async () => {
    // Create test user
    const [user] = await db.insert(usersTable)
      .values({
        username: 'testuser',
        email: 'test@example.com',
        credits_balance: '1000.00',
        is_admin: false
      })
      .returning()
      .execute();
    testUserId = user.id;

    // Create test token
    const [token] = await db.insert(tokensTable)
      .values({
        name: 'Test Token',
        symbol: 'TEST',
        description: 'A test token',
        initial_supply: '1000000.00',
        current_supply: '1000000.00',
        current_price: '1.50',
        creator_id: testUserId,
        status: 'active'
      })
      .returning()
      .execute();
    testTokenId = token.id;
  });

  it('should successfully buy tokens', async () => {
    const buyInput: TradeTokenInput = {
      user_id: testUserId,
      token_id: testTokenId,
      transaction_type: 'buy',
      amount: 100
    };

    const result = await tradeToken(buyInput);

    // Verify transaction record
    expect(result.user_id).toBe(testUserId);
    expect(result.token_id).toBe(testTokenId);
    expect(result.transaction_type).toBe('buy');
    expect(result.amount).toBe(100);
    expect(result.price_per_token).toBe(1.50);
    expect(result.total_cost).toBe(150);
    expect(result.credits_change).toBe(-150);
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);

    // Verify user credits were deducted
    const [updatedUser] = await db.select()
      .from(usersTable)
      .where(eq(usersTable.id, testUserId))
      .execute();
    expect(parseFloat(updatedUser.credits_balance)).toBe(850);

    // Verify token balance was created
    const [tokenBalance] = await db.select()
      .from(userTokenBalancesTable)
      .where(and(
        eq(userTokenBalancesTable.user_id, testUserId),
        eq(userTokenBalancesTable.token_id, testTokenId)
      ))
      .execute();
    expect(parseFloat(tokenBalance.balance)).toBe(100);
  });

  it('should successfully sell tokens', async () => {
    // First buy some tokens
    await db.insert(userTokenBalancesTable)
      .values({
        user_id: testUserId,
        token_id: testTokenId,
        balance: '200.00'
      })
      .execute();

    const sellInput: TradeTokenInput = {
      user_id: testUserId,
      token_id: testTokenId,
      transaction_type: 'sell',
      amount: 50
    };

    const result = await tradeToken(sellInput);

    // Verify transaction record
    expect(result.user_id).toBe(testUserId);
    expect(result.token_id).toBe(testTokenId);
    expect(result.transaction_type).toBe('sell');
    expect(result.amount).toBe(50);
    expect(result.price_per_token).toBe(1.50);
    expect(result.total_cost).toBe(75);
    expect(result.credits_change).toBe(75);

    // Verify user credits were increased
    const [updatedUser] = await db.select()
      .from(usersTable)
      .where(eq(usersTable.id, testUserId))
      .execute();
    expect(parseFloat(updatedUser.credits_balance)).toBe(1075);

    // Verify token balance was reduced
    const [tokenBalance] = await db.select()
      .from(userTokenBalancesTable)
      .where(and(
        eq(userTokenBalancesTable.user_id, testUserId),
        eq(userTokenBalancesTable.token_id, testTokenId)
      ))
      .execute();
    expect(parseFloat(tokenBalance.balance)).toBe(150);
  });

  it('should fail when user has insufficient credits for buy', async () => {
    const buyInput: TradeTokenInput = {
      user_id: testUserId,
      token_id: testTokenId,
      transaction_type: 'buy',
      amount: 1000 // Would cost 1500 credits, but user only has 1000
    };

    await expect(tradeToken(buyInput)).rejects.toThrow(/insufficient credits/i);
  });

  it('should fail when user has insufficient token balance for sell', async () => {
    const sellInput: TradeTokenInput = {
      user_id: testUserId,
      token_id: testTokenId,
      transaction_type: 'sell',
      amount: 100 // User has no tokens
    };

    await expect(tradeToken(sellInput)).rejects.toThrow(/insufficient token balance/i);
  });

  it('should fail when user does not exist', async () => {
    const buyInput: TradeTokenInput = {
      user_id: 99999,
      token_id: testTokenId,
      transaction_type: 'buy',
      amount: 10
    };

    await expect(tradeToken(buyInput)).rejects.toThrow(/user not found/i);
  });

  it('should fail when token does not exist', async () => {
    const buyInput: TradeTokenInput = {
      user_id: testUserId,
      token_id: 99999,
      transaction_type: 'buy',
      amount: 10
    };

    await expect(tradeToken(buyInput)).rejects.toThrow(/token not found/i);
  });

  it('should fail when token is not active', async () => {
    // Update token to inactive status
    await db.update(tokensTable)
      .set({ status: 'inactive' })
      .where(eq(tokensTable.id, testTokenId))
      .execute();

    const buyInput: TradeTokenInput = {
      user_id: testUserId,
      token_id: testTokenId,
      transaction_type: 'buy',
      amount: 10
    };

    await expect(tradeToken(buyInput)).rejects.toThrow(/token is not active/i);
  });

  it('should update existing token balance correctly', async () => {
    // Create initial token balance
    await db.insert(userTokenBalancesTable)
      .values({
        user_id: testUserId,
        token_id: testTokenId,
        balance: '50.00'
      })
      .execute();

    const buyInput: TradeTokenInput = {
      user_id: testUserId,
      token_id: testTokenId,
      transaction_type: 'buy',
      amount: 25
    };

    await tradeToken(buyInput);

    // Verify balance was updated, not duplicated
    const balances = await db.select()
      .from(userTokenBalancesTable)
      .where(and(
        eq(userTokenBalancesTable.user_id, testUserId),
        eq(userTokenBalancesTable.token_id, testTokenId)
      ))
      .execute();

    expect(balances).toHaveLength(1);
    expect(parseFloat(balances[0].balance)).toBe(75);
  });
});
