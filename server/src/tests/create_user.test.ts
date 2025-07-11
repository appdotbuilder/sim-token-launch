
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable } from '../db/schema';
import { type CreateUserInput } from '../schema';
import { createUser } from '../handlers/create_user';
import { eq } from 'drizzle-orm';

// Test input with all required fields
const testInput: CreateUserInput = {
  username: 'testuser',
  email: 'test@example.com',
  credits_balance: 1000,
  is_admin: false
};

describe('createUser', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a user', async () => {
    const result = await createUser(testInput);

    // Basic field validation
    expect(result.username).toEqual('testuser');
    expect(result.email).toEqual('test@example.com');
    expect(result.credits_balance).toEqual(1000);
    expect(typeof result.credits_balance).toEqual('number');
    expect(result.is_admin).toEqual(false);
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should save user to database', async () => {
    const result = await createUser(testInput);

    // Query using proper drizzle syntax
    const users = await db.select()
      .from(usersTable)
      .where(eq(usersTable.id, result.id))
      .execute();

    expect(users).toHaveLength(1);
    expect(users[0].username).toEqual('testuser');
    expect(users[0].email).toEqual('test@example.com');
    expect(parseFloat(users[0].credits_balance)).toEqual(1000);
    expect(users[0].is_admin).toEqual(false);
    expect(users[0].created_at).toBeInstanceOf(Date);
    expect(users[0].updated_at).toBeInstanceOf(Date);
  });

  it('should create admin user', async () => {
    const adminInput: CreateUserInput = {
      username: 'admin',
      email: 'admin@example.com',
      credits_balance: 5000,
      is_admin: true
    };

    const result = await createUser(adminInput);

    expect(result.username).toEqual('admin');
    expect(result.email).toEqual('admin@example.com');
    expect(result.credits_balance).toEqual(5000);
    expect(result.is_admin).toEqual(true);
  });

  it('should apply default values correctly', async () => {
    const minimalInput = {
      username: 'minimal',
      email: 'minimal@example.com'
      // credits_balance and is_admin will be undefined, should use defaults
    };

    const result = await createUser(minimalInput as CreateUserInput);

    expect(result.username).toEqual('minimal');
    expect(result.email).toEqual('minimal@example.com');
    expect(result.credits_balance).toEqual(1000); // Default value
    expect(result.is_admin).toEqual(false); // Default value
  });

  it('should fail with duplicate username', async () => {
    await createUser(testInput);

    const duplicateInput: CreateUserInput = {
      username: 'testuser', // Same username
      email: 'different@example.com',
      credits_balance: 500,
      is_admin: false
    };

    await expect(createUser(duplicateInput)).rejects.toThrow(/unique/i);
  });

  it('should fail with duplicate email', async () => {
    await createUser(testInput);

    const duplicateInput: CreateUserInput = {
      username: 'differentuser',
      email: 'test@example.com', // Same email
      credits_balance: 500,
      is_admin: false
    };

    await expect(createUser(duplicateInput)).rejects.toThrow(/unique/i);
  });
});
