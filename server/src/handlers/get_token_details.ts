
import { db } from '../db';
import { tokensTable, usersTable } from '../db/schema';
import { type GetTokenDetailsInput, type Token } from '../schema';
import { eq } from 'drizzle-orm';

export const getTokenDetails = async (input: GetTokenDetailsInput): Promise<Token | null> => {
  try {
    // Query token with creator information using join
    const results = await db.select()
      .from(tokensTable)
      .innerJoin(usersTable, eq(tokensTable.creator_id, usersTable.id))
      .where(eq(tokensTable.id, input.token_id))
      .execute();

    if (results.length === 0) {
      return null;
    }

    const result = results[0];
    const tokenData = result.tokens;

    // Convert numeric fields back to numbers
    return {
      id: tokenData.id,
      name: tokenData.name,
      symbol: tokenData.symbol,
      description: tokenData.description,
      initial_supply: parseFloat(tokenData.initial_supply),
      current_supply: parseFloat(tokenData.current_supply),
      current_price: parseFloat(tokenData.current_price),
      creator_id: tokenData.creator_id,
      status: tokenData.status,
      created_at: tokenData.created_at,
      updated_at: tokenData.updated_at
    };
  } catch (error) {
    console.error('Token details fetch failed:', error);
    throw error;
  }
};
