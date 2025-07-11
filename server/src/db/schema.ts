
import { serial, text, pgTable, timestamp, numeric, integer, boolean, pgEnum, uniqueIndex } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Enums
export const tokenStatusEnum = pgEnum('token_status', ['active', 'paused', 'inactive']);
export const transactionTypeEnum = pgEnum('transaction_type', ['buy', 'sell']);

// Tables
export const usersTable = pgTable('users', {
  id: serial('id').primaryKey(),
  username: text('username').notNull(),
  email: text('email').notNull(),
  credits_balance: numeric('credits_balance', { precision: 20, scale: 8 }).notNull().default('1000'),
  is_admin: boolean('is_admin').notNull().default(false),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull()
}, (table) => ({
  uniqueUsername: uniqueIndex('unique_username').on(table.username),
  uniqueEmail: uniqueIndex('unique_email').on(table.email)
}));

export const tokensTable = pgTable('tokens', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  symbol: text('symbol').notNull(),
  description: text('description'),
  initial_supply: numeric('initial_supply', { precision: 20, scale: 8 }).notNull(),
  current_supply: numeric('current_supply', { precision: 20, scale: 8 }).notNull(),
  current_price: numeric('current_price', { precision: 20, scale: 8 }).notNull().default('1.0'),
  creator_id: integer('creator_id').notNull().references(() => usersTable.id),
  status: tokenStatusEnum('status').notNull().default('active'),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull()
}, (table) => ({
  uniqueSymbol: uniqueIndex('unique_symbol').on(table.symbol)
}));

export const userTokenBalancesTable = pgTable('user_token_balances', {
  id: serial('id').primaryKey(),
  user_id: integer('user_id').notNull().references(() => usersTable.id),
  token_id: integer('token_id').notNull().references(() => tokensTable.id),
  balance: numeric('balance', { precision: 20, scale: 8 }).notNull().default('0'),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull()
}, (table) => ({
  uniqueUserToken: uniqueIndex('unique_user_token').on(table.user_id, table.token_id)
}));

export const transactionsTable = pgTable('transactions', {
  id: serial('id').primaryKey(),
  user_id: integer('user_id').notNull().references(() => usersTable.id),
  token_id: integer('token_id').notNull().references(() => tokensTable.id),
  transaction_type: transactionTypeEnum('transaction_type').notNull(),
  amount: numeric('amount', { precision: 20, scale: 8 }).notNull(),
  price_per_token: numeric('price_per_token', { precision: 20, scale: 8 }).notNull(),
  total_cost: numeric('total_cost', { precision: 20, scale: 8 }).notNull(),
  credits_change: numeric('credits_change', { precision: 20, scale: 8 }).notNull(),
  created_at: timestamp('created_at').defaultNow().notNull()
});

export const platformConfigTable = pgTable('platform_config', {
  id: serial('id').primaryKey(),
  transaction_fee_percentage: numeric('transaction_fee_percentage', { precision: 5, scale: 2 }).notNull().default('2.5'),
  default_token_supply: numeric('default_token_supply', { precision: 20, scale: 8 }).notNull().default('1000000'),
  default_token_price: numeric('default_token_price', { precision: 20, scale: 8 }).notNull().default('0.001'),
  ethereum_rpc_url: text('ethereum_rpc_url'),
  mainnet_rpc_url: text('mainnet_rpc_url'),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull()
});

// Relations
export const usersRelations = relations(usersTable, ({ many }) => ({
  createdTokens: many(tokensTable),
  tokenBalances: many(userTokenBalancesTable),
  transactions: many(transactionsTable)
}));

export const tokensRelations = relations(tokensTable, ({ one, many }) => ({
  creator: one(usersTable, {
    fields: [tokensTable.creator_id],
    references: [usersTable.id]
  }),
  userBalances: many(userTokenBalancesTable),
  transactions: many(transactionsTable)
}));

export const userTokenBalancesRelations = relations(userTokenBalancesTable, ({ one }) => ({
  user: one(usersTable, {
    fields: [userTokenBalancesTable.user_id],
    references: [usersTable.id]
  }),
  token: one(tokensTable, {
    fields: [userTokenBalancesTable.token_id],
    references: [tokensTable.id]
  })
}));

export const transactionsRelations = relations(transactionsTable, ({ one }) => ({
  user: one(usersTable, {
    fields: [transactionsTable.user_id],
    references: [usersTable.id]
  }),
  token: one(tokensTable, {
    fields: [transactionsTable.token_id],
    references: [tokensTable.id]
  })
}));

// Export all tables for proper query building
export const tables = {
  users: usersTable,
  tokens: tokensTable,
  userTokenBalances: userTokenBalancesTable,
  transactions: transactionsTable,
  platformConfig: platformConfigTable
};
