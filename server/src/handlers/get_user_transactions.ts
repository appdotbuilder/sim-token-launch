
import { db } from '../db';
import { transactionsTable } from '../db/schema';
import { type GetUserTransactionsInput, type Transaction } from '../schema';
import { eq, and, desc } from 'drizzle-orm';
import type { SQL } from 'drizzle-orm';

export const getUserTransactions = async (input: GetUserTransactionsInput): Promise<Transaction[]> => {
  try {
    // Build conditions array
    const conditions: SQL<unknown>[] = [];
    
    // Always filter by user_id
    conditions.push(eq(transactionsTable.user_id, input.user_id));

    // Optionally filter by token_id
    if (input.token_id !== undefined) {
      conditions.push(eq(transactionsTable.token_id, input.token_id));
    }

    // Build and execute query
    const results = await db.select()
      .from(transactionsTable)
      .where(conditions.length === 1 ? conditions[0] : and(...conditions))
      .orderBy(desc(transactionsTable.created_at))
      .execute();

    // Convert numeric fields back to numbers
    return results.map(transaction => ({
      ...transaction,
      amount: parseFloat(transaction.amount),
      price_per_token: parseFloat(transaction.price_per_token),
      total_cost: parseFloat(transaction.total_cost),
      credits_change: parseFloat(transaction.credits_change)
    }));
  } catch (error) {
    console.error('Failed to get user transactions:', error);
    throw error;
  }
};
