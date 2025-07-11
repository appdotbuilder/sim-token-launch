
import { db } from '../db';
import { platformConfigTable } from '../db/schema';
import { type PlatformConfig } from '../schema';

export const getPlatformConfig = async (): Promise<PlatformConfig> => {
  try {
    // Get the first (and typically only) platform config record
    const result = await db.select()
      .from(platformConfigTable)
      .limit(1)
      .execute();

    if (result.length === 0) {
      throw new Error('Platform configuration not found');
    }

    const config = result[0];
    
    // Convert numeric fields back to numbers
    return {
      ...config,
      transaction_fee_percentage: parseFloat(config.transaction_fee_percentage),
      default_token_supply: parseFloat(config.default_token_supply),
      default_token_price: parseFloat(config.default_token_price)
    };
  } catch (error) {
    console.error('Failed to get platform config:', error);
    throw error;
  }
};
