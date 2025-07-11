
import { db } from '../db';
import { tokensTable } from '../db/schema';
import { type UpdateTokenInput, type Token } from '../schema';
import { eq } from 'drizzle-orm';

export const updateToken = async (input: UpdateTokenInput): Promise<Token> => {
  try {
    // Build update object with only provided fields
    const updateData: Partial<{
      name: string;
      symbol: string;
      description: string | null;
      status: 'active' | 'paused' | 'inactive';
      updated_at: Date;
    }> = {
      updated_at: new Date()
    };

    if (input.name !== undefined) {
      updateData.name = input.name;
    }
    if (input.symbol !== undefined) {
      updateData.symbol = input.symbol;
    }
    if (input.description !== undefined) {
      updateData.description = input.description;
    }
    if (input.status !== undefined) {
      updateData.status = input.status;
    }

    // Update the token record
    const result = await db.update(tokensTable)
      .set(updateData)
      .where(eq(tokensTable.id, input.id))
      .returning()
      .execute();

    if (result.length === 0) {
      throw new Error('Token not found');
    }

    // Convert numeric fields back to numbers before returning
    const token = result[0];
    return {
      ...token,
      initial_supply: parseFloat(token.initial_supply),
      current_supply: parseFloat(token.current_supply),
      current_price: parseFloat(token.current_price)
    };
  } catch (error) {
    console.error('Token update failed:', error);
    throw error;
  }
};
