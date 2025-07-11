
import { db } from '../db';
import { usersTable } from '../db/schema';
import { type CreateUserInput, type User } from '../schema';

export const createUser = async (input: CreateUserInput): Promise<User> => {
  try {
    // Insert user record, handling potential undefined values for fields with defaults
    const result = await db.insert(usersTable)
      .values({
        username: input.username,
        email: input.email,
        credits_balance: (input.credits_balance ?? 1000).toString(), // Convert number to string for numeric column, apply default
        is_admin: input.is_admin ?? false // Apply default for boolean
      })
      .returning()
      .execute();

    // Convert numeric fields back to numbers before returning
    const user = result[0];
    return {
      ...user,
      credits_balance: parseFloat(user.credits_balance) // Convert string back to number
    };
  } catch (error) {
    console.error('User creation failed:', error);
    throw error;
  }
};
