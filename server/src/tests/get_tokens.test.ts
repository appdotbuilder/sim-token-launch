
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, tokensTable } from '../db/schema';
import { getTokens } from '../handlers/get_tokens';

describe('getTokens', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no tokens exist', async () => {
    const result = await getTokens();
    expect(result).toEqual([]);
  });

  it('should return all tokens with correct numeric conversions', async () => {
    // Create a user first (required for token creation)
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

    // Create test tokens
    await db.insert(tokensTable)
      .values([
        {
          name: 'Token A',
          symbol: 'TOKA',
          description: 'First test token',
          initial_supply: '1000000',
          current_supply: '1000000',
          current_price: '0.001',
          creator_id: userId,
          status: 'active'
        },
        {
          name: 'Token B',
          symbol: 'TOKB',
          description: 'Second test token',
          initial_supply: '500000',
          current_supply: '450000',
          current_price: '0.002',
          creator_id: userId,
          status: 'paused'
        }
      ])
      .execute();

    const result = await getTokens();

    expect(result).toHaveLength(2);

    // Check first token
    const tokenA = result.find(t => t.symbol === 'TOKA');
    expect(tokenA).toBeDefined();
    expect(tokenA!.name).toEqual('Token A');
    expect(tokenA!.description).toEqual('First test token');
    expect(tokenA!.initial_supply).toEqual(1000000);
    expect(tokenA!.current_supply).toEqual(1000000);
    expect(tokenA!.current_price).toEqual(0.001);
    expect(tokenA!.creator_id).toEqual(userId);
    expect(tokenA!.status).toEqual('active');
    expect(tokenA!.id).toBeDefined();
    expect(tokenA!.created_at).toBeInstanceOf(Date);
    expect(tokenA!.updated_at).toBeInstanceOf(Date);

    // Check second token
    const tokenB = result.find(t => t.symbol === 'TOKB');
    expect(tokenB).toBeDefined();
    expect(tokenB!.name).toEqual('Token B');
    expect(tokenB!.description).toEqual('Second test token');
    expect(tokenB!.initial_supply).toEqual(500000);
    expect(tokenB!.current_supply).toEqual(450000);
    expect(tokenB!.current_price).toEqual(0.002);
    expect(tokenB!.creator_id).toEqual(userId);
    expect(tokenB!.status).toEqual('paused');

    // Verify numeric types
    expect(typeof tokenA!.initial_supply).toBe('number');
    expect(typeof tokenA!.current_supply).toBe('number');
    expect(typeof tokenA!.current_price).toBe('number');
    expect(typeof tokenB!.initial_supply).toBe('number');
    expect(typeof tokenB!.current_supply).toBe('number');
    expect(typeof tokenB!.current_price).toBe('number');
  });

  it('should handle tokens with null descriptions', async () => {
    // Create a user first
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

    // Create token with null description
    await db.insert(tokensTable)
      .values({
        name: 'Token Without Description',
        symbol: 'NODEF',
        description: null,
        initial_supply: '100000',
        current_supply: '100000',
        current_price: '0.05',
        creator_id: userId,
        status: 'inactive'
      })
      .execute();

    const result = await getTokens();

    expect(result).toHaveLength(1);
    expect(result[0].description).toBeNull();
    expect(result[0].name).toEqual('Token Without Description');
    expect(result[0].status).toEqual('inactive');
  });

  it('should return tokens ordered by creation', async () => {
    // Create a user first
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

    // Create multiple tokens
    await db.insert(tokensTable)
      .values([
        {
          name: 'First Token',
          symbol: 'FIRST',
          description: 'Created first',
          initial_supply: '1000',
          current_supply: '1000',
          current_price: '1.0',
          creator_id: userId,
          status: 'active'
        },
        {
          name: 'Second Token',
          symbol: 'SECOND',
          description: 'Created second',
          initial_supply: '2000',
          current_supply: '2000',
          current_price: '2.0',
          creator_id: userId,
          status: 'active'
        }
      ])
      .execute();

    const result = await getTokens();

    expect(result).toHaveLength(2);
    
    // Verify all tokens are returned
    const symbols = result.map(t => t.symbol);
    expect(symbols).toContain('FIRST');
    expect(symbols).toContain('SECOND');
  });
});
