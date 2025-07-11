
import { db } from '../db';
import { platformConfigTable } from '../db/schema';
import { type UpdatePlatformConfigInput, type PlatformConfig } from '../schema';
import { eq } from 'drizzle-orm';

export const updatePlatformConfig = async (input: UpdatePlatformConfigInput): Promise<PlatformConfig> => {
  try {
    // Check if platform config exists
    const existingConfig = await db.select()
      .from(platformConfigTable)
      .limit(1)
      .execute();

    if (existingConfig.length === 0) {
      // Create initial platform config if it doesn't exist
      const result = await db.insert(platformConfigTable)
        .values({
          transaction_fee_percentage: input.transaction_fee_percentage?.toString() || '2.5',
          default_token_supply: input.default_token_supply?.toString() || '1000000',
          default_token_price: input.default_token_price?.toString() || '0.001',
          ethereum_rpc_url: input.ethereum_rpc_url || null,
          mainnet_rpc_url: input.mainnet_rpc_url || null
        })
        .returning()
        .execute();

      const config = result[0];
      return {
        ...config,
        transaction_fee_percentage: parseFloat(config.transaction_fee_percentage),
        default_token_supply: parseFloat(config.default_token_supply),
        default_token_price: parseFloat(config.default_token_price)
      };
    }

    // Update existing platform config
    const updateData: any = {};
    
    if (input.transaction_fee_percentage !== undefined) {
      updateData.transaction_fee_percentage = input.transaction_fee_percentage.toString();
    }
    
    if (input.default_token_supply !== undefined) {
      updateData.default_token_supply = input.default_token_supply.toString();
    }
    
    if (input.default_token_price !== undefined) {
      updateData.default_token_price = input.default_token_price.toString();
    }
    
    if (input.ethereum_rpc_url !== undefined) {
      updateData.ethereum_rpc_url = input.ethereum_rpc_url;
    }
    
    if (input.mainnet_rpc_url !== undefined) {
      updateData.mainnet_rpc_url = input.mainnet_rpc_url;
    }

    updateData.updated_at = new Date();

    const result = await db.update(platformConfigTable)
      .set(updateData)
      .where(eq(platformConfigTable.id, existingConfig[0].id))
      .returning()
      .execute();

    const config = result[0];
    return {
      ...config,
      transaction_fee_percentage: parseFloat(config.transaction_fee_percentage),
      default_token_supply: parseFloat(config.default_token_supply),
      default_token_price: parseFloat(config.default_token_price)
    };
  } catch (error) {
    console.error('Platform config update failed:', error);
    throw error;
  }
};
