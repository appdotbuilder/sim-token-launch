
import { db } from '../db';
import { tokensTable, usersTable } from '../db/schema';
import { type CreateTokenInput, type Token } from '../schema';
import { eq } from 'drizzle-orm';

export const createToken = async (input: CreateTokenInput): Promise<Token> => {
  try {
    // Verify creator exists
    const creator = await db.select()
      .from(usersTable)
      .where(eq(usersTable.id, input.creator_id))
      .execute();

    if (creator.length === 0) {
      throw new Error('Creator user not found');
    }

    // Insert token record
    const result = await db.insert(tokensTable)
      .values({
        name: input.name,
        symbol: input.symbol,
        description: input.description,
        initial_supply: input.initial_supply.toString(),
        current_supply: input.initial_supply.toString(),
        current_price: '1.0', // Default initial price
        creator_id: input.creator_id,
        status: 'active'
      })
      .returning()
      .execute();

    // Convert numeric fields back to numbers before returning
    const token = result[0];
    return {
      ...token,
      initial_supply: parseFloat(token.initial_supply),
      current_supply: parseFloat(token.current_supply),
      current_price: parseFloat(token.current_price)
    };
  } catch (error) {
    console.error('Token creation failed:', error);
    throw error;
  }
};
