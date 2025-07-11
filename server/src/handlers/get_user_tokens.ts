
import { db } from '../db';
import { userTokenBalancesTable, tokensTable, usersTable } from '../db/schema';
import { type GetUserTokensInput, type UserTokenBalance } from '../schema';
import { eq } from 'drizzle-orm';

export const getUserTokens = async (input: GetUserTokensInput): Promise<UserTokenBalance[]> => {
  try {
    // Query user token balances with token details
    const results = await db.select()
      .from(userTokenBalancesTable)
      .innerJoin(tokensTable, eq(userTokenBalancesTable.token_id, tokensTable.id))
      .innerJoin(usersTable, eq(userTokenBalancesTable.user_id, usersTable.id))
      .where(eq(userTokenBalancesTable.user_id, input.user_id))
      .execute();

    // Transform results to match UserTokenBalance schema
    return results.map(result => ({
      id: result.user_token_balances.id,
      user_id: result.user_token_balances.user_id,
      token_id: result.user_token_balances.token_id,
      balance: parseFloat(result.user_token_balances.balance),
      created_at: result.user_token_balances.created_at,
      updated_at: result.user_token_balances.updated_at
    }));
  } catch (error) {
    console.error('Failed to get user tokens:', error);
    throw error;
  }
};
