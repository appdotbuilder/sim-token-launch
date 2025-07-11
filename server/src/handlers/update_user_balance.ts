
import { db } from '../db';
import { usersTable, userTokenBalancesTable } from '../db/schema';
import { type UpdateUserBalanceInput, type User } from '../schema';
import { eq, and } from 'drizzle-orm';

export const updateUserBalance = async (input: UpdateUserBalanceInput): Promise<User> => {
  try {
    // Update user's credits balance if provided
    if (input.credits_balance !== undefined) {
      await db.update(usersTable)
        .set({ 
          credits_balance: input.credits_balance.toString(),
          updated_at: new Date()
        })
        .where(eq(usersTable.id, input.user_id))
        .execute();
    }

    // Update token balances if provided
    if (input.token_balances && input.token_balances.length > 0) {
      for (const tokenBalance of input.token_balances) {
        // Try to update existing balance first
        const updateResult = await db.update(userTokenBalancesTable)
          .set({ 
            balance: tokenBalance.balance.toString(),
            updated_at: new Date()
          })
          .where(and(
            eq(userTokenBalancesTable.user_id, input.user_id),
            eq(userTokenBalancesTable.token_id, tokenBalance.token_id)
          ))
          .execute();

        // If no existing balance was updated, create new one
        if (updateResult.rowCount === 0) {
          await db.insert(userTokenBalancesTable)
            .values({
              user_id: input.user_id,
              token_id: tokenBalance.token_id,
              balance: tokenBalance.balance.toString()
            })
            .execute();
        }
      }
    }

    // Fetch and return updated user
    const users = await db.select()
      .from(usersTable)
      .where(eq(usersTable.id, input.user_id))
      .execute();

    if (users.length === 0) {
      throw new Error('User not found');
    }

    const user = users[0];
    return {
      ...user,
      credits_balance: parseFloat(user.credits_balance)
    };
  } catch (error) {
    console.error('User balance update failed:', error);
    throw error;
  }
};
