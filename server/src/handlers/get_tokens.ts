
import { db } from '../db';
import { tokensTable } from '../db/schema';
import { type Token } from '../schema';

export const getTokens = async (): Promise<Token[]> => {
  try {
    const results = await db.select()
      .from(tokensTable)
      .execute();

    // Convert numeric fields back to numbers before returning
    return results.map(token => ({
      ...token,
      initial_supply: parseFloat(token.initial_supply),
      current_supply: parseFloat(token.current_supply),
      current_price: parseFloat(token.current_price)
    }));
  } catch (error) {
    console.error('Failed to fetch tokens:', error);
    throw error;
  }
};
