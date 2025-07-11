
import { db } from '../db';
import { usersTable } from '../db/schema';
import { type User } from '../schema';

export const getUsers = async (): Promise<User[]> => {
  try {
    const result = await db.select()
      .from(usersTable)
      .execute();

    // Convert numeric fields back to numbers before returning
    return result.map(user => ({
      ...user,
      credits_balance: parseFloat(user.credits_balance)
    }));
  } catch (error) {
    console.error('Get users failed:', error);
    throw error;
  }
};
