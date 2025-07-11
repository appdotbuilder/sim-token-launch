
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable } from '../db/schema';
import { getUsers } from '../handlers/get_users';

describe('getUsers', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no users exist', async () => {
    const result = await getUsers();
    
    expect(result).toEqual([]);
  });

  it('should return all users', async () => {
    // Create test users
    await db.insert(usersTable).values([
      {
        username: 'testuser1',
        email: 'test1@example.com',
        credits_balance: '1000',
        is_admin: false
      },
      {
        username: 'testuser2',
        email: 'test2@example.com',
        credits_balance: '2500.50',
        is_admin: true
      }
    ]).execute();

    const result = await getUsers();

    expect(result).toHaveLength(2);
    
    // Check first user
    expect(result[0].username).toEqual('testuser1');
    expect(result[0].email).toEqual('test1@example.com');
    expect(result[0].credits_balance).toEqual(1000);
    expect(typeof result[0].credits_balance).toEqual('number');
    expect(result[0].is_admin).toEqual(false);
    expect(result[0].id).toBeDefined();
    expect(result[0].created_at).toBeInstanceOf(Date);
    expect(result[0].updated_at).toBeInstanceOf(Date);

    // Check second user
    expect(result[1].username).toEqual('testuser2');
    expect(result[1].email).toEqual('test2@example.com');
    expect(result[1].credits_balance).toEqual(2500.50);
    expect(typeof result[1].credits_balance).toEqual('number');
    expect(result[1].is_admin).toEqual(true);
    expect(result[1].id).toBeDefined();
    expect(result[1].created_at).toBeInstanceOf(Date);
    expect(result[1].updated_at).toBeInstanceOf(Date);
  });

  it('should handle users with different credit balances', async () => {
    // Create users with various credit balances
    await db.insert(usersTable).values([
      {
        username: 'user1',
        email: 'user1@example.com',
        credits_balance: '0',
        is_admin: false
      },
      {
        username: 'user2',
        email: 'user2@example.com',
        credits_balance: '999.99',
        is_admin: false
      },
      {
        username: 'user3',
        email: 'user3@example.com',
        credits_balance: '10000.123456',
        is_admin: true
      }
    ]).execute();

    const result = await getUsers();

    expect(result).toHaveLength(3);
    
    // Verify numeric conversion for all users
    expect(result[0].credits_balance).toEqual(0);
    expect(result[1].credits_balance).toEqual(999.99);
    expect(result[2].credits_balance).toEqual(10000.123456);
    
    // Verify all are numbers
    result.forEach(user => {
      expect(typeof user.credits_balance).toEqual('number');
    });
  });
});
