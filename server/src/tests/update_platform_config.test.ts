
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { platformConfigTable } from '../db/schema';
import { type UpdatePlatformConfigInput } from '../schema';
import { updatePlatformConfig } from '../handlers/update_platform_config';
import { eq } from 'drizzle-orm';

describe('updatePlatformConfig', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create platform config when none exists', async () => {
    const input: UpdatePlatformConfigInput = {
      transaction_fee_percentage: 3.5,
      default_token_supply: 2000000,
      default_token_price: 0.002,
      ethereum_rpc_url: 'https://mainnet.infura.io/v3/test',
      mainnet_rpc_url: 'https://ethereum.publicnode.com'
    };

    const result = await updatePlatformConfig(input);

    // Verify returned values
    expect(result.transaction_fee_percentage).toBe(3.5);
    expect(result.default_token_supply).toBe(2000000);
    expect(result.default_token_price).toBe(0.002);
    expect(result.ethereum_rpc_url).toBe('https://mainnet.infura.io/v3/test');
    expect(result.mainnet_rpc_url).toBe('https://ethereum.publicnode.com');
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should create platform config with default values when input is empty', async () => {
    const input: UpdatePlatformConfigInput = {};

    const result = await updatePlatformConfig(input);

    // Verify default values
    expect(result.transaction_fee_percentage).toBe(2.5);
    expect(result.default_token_supply).toBe(1000000);
    expect(result.default_token_price).toBe(0.001);
    expect(result.ethereum_rpc_url).toBeNull();
    expect(result.mainnet_rpc_url).toBeNull();
  });

  it('should update existing platform config', async () => {
    // Create initial config
    await db.insert(platformConfigTable)
      .values({
        transaction_fee_percentage: '2.5',
        default_token_supply: '1000000',
        default_token_price: '0.001',
        ethereum_rpc_url: 'https://old.url',
        mainnet_rpc_url: null
      })
      .execute();

    const input: UpdatePlatformConfigInput = {
      transaction_fee_percentage: 4.0,
      default_token_supply: 3000000,
      ethereum_rpc_url: 'https://new.url',
      mainnet_rpc_url: 'https://mainnet.new.url'
    };

    const result = await updatePlatformConfig(input);

    // Verify updated values
    expect(result.transaction_fee_percentage).toBe(4.0);
    expect(result.default_token_supply).toBe(3000000);
    expect(result.default_token_price).toBe(0.001); // Should remain unchanged
    expect(result.ethereum_rpc_url).toBe('https://new.url');
    expect(result.mainnet_rpc_url).toBe('https://mainnet.new.url');
  });

  it('should update only specified fields', async () => {
    // Create initial config
    await db.insert(platformConfigTable)
      .values({
        transaction_fee_percentage: '2.5',
        default_token_supply: '1000000',
        default_token_price: '0.001',
        ethereum_rpc_url: 'https://old.url',
        mainnet_rpc_url: 'https://old.mainnet.url'
      })
      .execute();

    const input: UpdatePlatformConfigInput = {
      transaction_fee_percentage: 5.0
    };

    const result = await updatePlatformConfig(input);

    // Verify only transaction_fee_percentage was updated
    expect(result.transaction_fee_percentage).toBe(5.0);
    expect(result.default_token_supply).toBe(1000000);
    expect(result.default_token_price).toBe(0.001);
    expect(result.ethereum_rpc_url).toBe('https://old.url');
    expect(result.mainnet_rpc_url).toBe('https://old.mainnet.url');
  });

  it('should save updated config to database', async () => {
    const input: UpdatePlatformConfigInput = {
      transaction_fee_percentage: 1.5,
      default_token_supply: 500000,
      default_token_price: 0.0005,
      ethereum_rpc_url: null,
      mainnet_rpc_url: 'https://mainnet.test'
    };

    const result = await updatePlatformConfig(input);

    // Query database to verify changes were saved
    const configs = await db.select()
      .from(platformConfigTable)
      .where(eq(platformConfigTable.id, result.id))
      .execute();

    expect(configs).toHaveLength(1);
    const config = configs[0];
    expect(parseFloat(config.transaction_fee_percentage)).toBe(1.5);
    expect(parseFloat(config.default_token_supply)).toBe(500000);
    expect(parseFloat(config.default_token_price)).toBe(0.0005);
    expect(config.ethereum_rpc_url).toBeNull();
    expect(config.mainnet_rpc_url).toBe('https://mainnet.test');
  });

  it('should handle null values correctly', async () => {
    // Create initial config with values
    await db.insert(platformConfigTable)
      .values({
        transaction_fee_percentage: '2.5',
        default_token_supply: '1000000',
        default_token_price: '0.001',
        ethereum_rpc_url: 'https://old.url',
        mainnet_rpc_url: 'https://old.mainnet.url'
      })
      .execute();

    const input: UpdatePlatformConfigInput = {
      ethereum_rpc_url: null,
      mainnet_rpc_url: null
    };

    const result = await updatePlatformConfig(input);

    // Verify URLs were set to null
    expect(result.ethereum_rpc_url).toBeNull();
    expect(result.mainnet_rpc_url).toBeNull();
    expect(result.transaction_fee_percentage).toBe(2.5);
    expect(result.default_token_supply).toBe(1000000);
    expect(result.default_token_price).toBe(0.001);
  });
});
