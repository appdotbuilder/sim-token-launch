
import { initTRPC } from '@trpc/server';
import { createHTTPServer } from '@trpc/server/adapters/standalone';
import 'dotenv/config';
import cors from 'cors';
import superjson from 'superjson';

// Import schemas
import {
  createUserInputSchema,
  createTokenInputSchema,
  updateTokenInputSchema,
  tradeTokenInputSchema,
  updateUserBalanceInputSchema,
  updatePlatformConfigInputSchema,
  getUserTokensInputSchema,
  getTokenDetailsInputSchema,
  getUserTransactionsInputSchema
} from './schema';

// Import handlers
import { createUser } from './handlers/create_user';
import { getUsers } from './handlers/get_users';
import { createToken } from './handlers/create_token';
import { getTokens } from './handlers/get_tokens';
import { getTokenDetails } from './handlers/get_token_details';
import { updateToken } from './handlers/update_token';
import { tradeToken } from './handlers/trade_token';
import { getUserTokens } from './handlers/get_user_tokens';
import { getUserTransactions } from './handlers/get_user_transactions';
import { updateUserBalance } from './handlers/update_user_balance';
import { getPlatformConfig } from './handlers/get_platform_config';
import { updatePlatformConfig } from './handlers/update_platform_config';

const t = initTRPC.create({
  transformer: superjson,
});

const publicProcedure = t.procedure;
const router = t.router;

const appRouter = router({
  // Health check
  healthcheck: publicProcedure.query(() => {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }),

  // User management
  createUser: publicProcedure
    .input(createUserInputSchema)
    .mutation(({ input }) => createUser(input)),
  
  getUsers: publicProcedure
    .query(() => getUsers()),

  updateUserBalance: publicProcedure
    .input(updateUserBalanceInputSchema)
    .mutation(({ input }) => updateUserBalance(input)),

  // Token management
  createToken: publicProcedure
    .input(createTokenInputSchema)
    .mutation(({ input }) => createToken(input)),

  getTokens: publicProcedure
    .query(() => getTokens()),

  getTokenDetails: publicProcedure
    .input(getTokenDetailsInputSchema)
    .query(({ input }) => getTokenDetails(input)),

  updateToken: publicProcedure
    .input(updateTokenInputSchema)
    .mutation(({ input }) => updateToken(input)),

  // Trading
  tradeToken: publicProcedure
    .input(tradeTokenInputSchema)
    .mutation(({ input }) => tradeToken(input)),

  // User wallet/dashboard
  getUserTokens: publicProcedure
    .input(getUserTokensInputSchema)
    .query(({ input }) => getUserTokens(input)),

  getUserTransactions: publicProcedure
    .input(getUserTransactionsInputSchema)
    .query(({ input }) => getUserTransactions(input)),

  // Platform configuration
  getPlatformConfig: publicProcedure
    .query(() => getPlatformConfig()),

  updatePlatformConfig: publicProcedure
    .input(updatePlatformConfigInputSchema)
    .mutation(({ input }) => updatePlatformConfig(input)),
});

export type AppRouter = typeof appRouter;

async function start() {
  const port = process.env['SERVER_PORT'] || 2022;
  const server = createHTTPServer({
    middleware: (req, res, next) => {
      cors()(req, res, next);
    },
    router: appRouter,
    createContext() {
      return {};
    },
  });
  server.listen(port);
  console.log(`TRPC server listening at port: ${port}`);
}

start();
