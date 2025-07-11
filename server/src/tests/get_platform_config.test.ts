
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { platformConfigTable } from '../db/schema';
import { getPlatformConfig } from '../handlers/get_platform_config';

describe('getPlatformConfig', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return platform config with default values', async () => {
    // Insert default platform config
    await db.insert(platformConfigTable)
      .values({
        transaction_fee_percentage: '2.5',
        default_token_supply: '1000000',
        default_token_price: '0.001',
        ethereum_rpc_url: null,
        mainnet_rpc_url: null
      })
      .execute();

    const result = await getPlatformConfig();

    expect(result.id).toBeDefined();
    expect(result.transaction_fee_percentage).toEqual(2.5);
    expect(result.default_token_supply).toEqual(1000000);
    expect(result.default_token_price).toEqual(0.001);
    expect(result.ethereum_rpc_url).toBeNull();
    expect(result.mainnet_rpc_url).toBeNull();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should return platform config with custom values', async () => {
    // Insert custom platform config
    await db.insert(platformConfigTable)
      .values({
        transaction_fee_percentage: '5.0',
        default_token_supply: '2000000',
        default_token_price: '0.01',
        ethereum_rpc_url: 'https://mainnet.infura.io/v3/test',
        mainnet_rpc_url: 'https://rpc.ankr.com/eth'
      })
      .execute();

    const result = await getPlatformConfig();

    expect(result.transaction_fee_percentage).toEqual(5.0);
    expect(result.default_token_supply).toEqual(2000000);
    expect(result.default_token_price).toEqual(0.01);
    expect(result.ethereum_rpc_url).toEqual('https://mainnet.infura.io/v3/test');
    expect(result.mainnet_rpc_url).toEqual('https://rpc.ankr.com/eth');
  });

  it('should throw error when no platform config exists', async () => {
    // Don't insert any config record
    await expect(getPlatformConfig()).rejects.toThrow(/platform configuration not found/i);
  });

  it('should verify numeric type conversions', async () => {
    await db.insert(platformConfigTable)
      .values({
        transaction_fee_percentage: '3.75',
        default_token_supply: '500000.5',
        default_token_price: '0.0025'
      })
      .execute();

    const result = await getPlatformConfig();

    expect(typeof result.transaction_fee_percentage).toBe('number');
    expect(typeof result.default_token_supply).toBe('number');
    expect(typeof result.default_token_price).toBe('number');
    expect(result.transaction_fee_percentage).toEqual(3.75);
    expect(result.default_token_supply).toEqual(500000.5);
    expect(result.default_token_price).toEqual(0.0025);
  });
});
