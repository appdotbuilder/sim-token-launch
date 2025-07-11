
import { z } from 'zod';

// User schema
export const userSchema = z.object({
  id: z.number(),
  username: z.string(),
  email: z.string().email(),
  credits_balance: z.number(), // Simulated base currency
  is_admin: z.boolean(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

export type User = z.infer<typeof userSchema>;

// Token schema
export const tokenSchema = z.object({
  id: z.number(),
  name: z.string(),
  symbol: z.string(),
  description: z.string().nullable(),
  initial_supply: z.number(),
  current_supply: z.number(),
  current_price: z.number(), // Current simulated price
  creator_id: z.number(),
  status: z.enum(['active', 'paused', 'inactive']),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

export type Token = z.infer<typeof tokenSchema>;

// User token balance schema
export const userTokenBalanceSchema = z.object({
  id: z.number(),
  user_id: z.number(),
  token_id: z.number(),
  balance: z.number(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

export type UserTokenBalance = z.infer<typeof userTokenBalanceSchema>;

// Transaction schema for simulated trading
export const transactionSchema = z.object({
  id: z.number(),
  user_id: z.number(),
  token_id: z.number(),
  transaction_type: z.enum(['buy', 'sell']),
  amount: z.number(),
  price_per_token: z.number(),
  total_cost: z.number(),
  credits_change: z.number(), // Positive for sells, negative for buys
  created_at: z.coerce.date()
});

export type Transaction = z.infer<typeof transactionSchema>;

// Platform configuration schema
export const platformConfigSchema = z.object({
  id: z.number(),
  transaction_fee_percentage: z.number(),
  default_token_supply: z.number(),
  default_token_price: z.number(),
  ethereum_rpc_url: z.string().nullable(),
  mainnet_rpc_url: z.string().nullable(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

export type PlatformConfig = z.infer<typeof platformConfigSchema>;

// Input schemas
export const createUserInputSchema = z.object({
  username: z.string().min(3).max(50),
  email: z.string().email(),
  credits_balance: z.number().nonnegative().default(1000),
  is_admin: z.boolean().default(false)
});

export type CreateUserInput = z.infer<typeof createUserInputSchema>;

export const createTokenInputSchema = z.object({
  name: z.string().min(1).max(100),
  symbol: z.string().min(1).max(10).toUpperCase(),
  description: z.string().nullable(),
  initial_supply: z.number().positive(),
  creator_id: z.number()
});

export type CreateTokenInput = z.infer<typeof createTokenInputSchema>;

export const updateTokenInputSchema = z.object({
  id: z.number(),
  name: z.string().min(1).max(100).optional(),
  symbol: z.string().min(1).max(10).toUpperCase().optional(),
  description: z.string().nullable().optional(),
  status: z.enum(['active', 'paused', 'inactive']).optional()
});

export type UpdateTokenInput = z.infer<typeof updateTokenInputSchema>;

export const tradeTokenInputSchema = z.object({
  user_id: z.number(),
  token_id: z.number(),
  transaction_type: z.enum(['buy', 'sell']),
  amount: z.number().positive()
});

export type TradeTokenInput = z.infer<typeof tradeTokenInputSchema>;

export const updateUserBalanceInputSchema = z.object({
  user_id: z.number(),
  credits_balance: z.number().nonnegative().optional(),
  token_balances: z.array(z.object({
    token_id: z.number(),
    balance: z.number().nonnegative()
  })).optional()
});

export type UpdateUserBalanceInput = z.infer<typeof updateUserBalanceInputSchema>;

export const updatePlatformConfigInputSchema = z.object({
  transaction_fee_percentage: z.number().min(0).max(100).optional(),
  default_token_supply: z.number().positive().optional(),
  default_token_price: z.number().positive().optional(),
  ethereum_rpc_url: z.string().nullable().optional(),
  mainnet_rpc_url: z.string().nullable().optional()
});

export type UpdatePlatformConfigInput = z.infer<typeof updatePlatformConfigInputSchema>;

// Query schemas
export const getUserTokensInputSchema = z.object({
  user_id: z.number()
});

export type GetUserTokensInput = z.infer<typeof getUserTokensInputSchema>;

export const getTokenDetailsInputSchema = z.object({
  token_id: z.number()
});

export type GetTokenDetailsInput = z.infer<typeof getTokenDetailsInputSchema>;

export const getUserTransactionsInputSchema = z.object({
  user_id: z.number(),
  token_id: z.number().optional()
});

export type GetUserTransactionsInput = z.infer<typeof getUserTransactionsInputSchema>;
