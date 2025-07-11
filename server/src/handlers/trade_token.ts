
import { db } from '../db';
import { usersTable, tokensTable, userTokenBalancesTable, transactionsTable } from '../db/schema';
import { type TradeTokenInput, type Transaction } from '../schema';
import { eq, and } from 'drizzle-orm';

export const tradeToken = async (input: TradeTokenInput): Promise<Transaction> => {
  try {
    // Start transaction to ensure atomicity
    return await db.transaction(async (trx) => {
      // Get user and token information
      const [user] = await trx.select()
        .from(usersTable)
        .where(eq(usersTable.id, input.user_id))
        .execute();

      if (!user) {
        throw new Error('User not found');
      }

      const [token] = await trx.select()
        .from(tokensTable)
        .where(eq(tokensTable.id, input.token_id))
        .execute();

      if (!token) {
        throw new Error('Token not found');
      }

      if (token.status !== 'active') {
        throw new Error('Token is not active');
      }

      // Get current user balance for this token
      const userTokenBalance = await trx.select()
        .from(userTokenBalancesTable)
        .where(and(
          eq(userTokenBalancesTable.user_id, input.user_id),
          eq(userTokenBalancesTable.token_id, input.token_id)
        ))
        .execute();

      const currentTokenBalance = userTokenBalance[0]?.balance ? parseFloat(userTokenBalance[0].balance) : 0;
      const userCreditsBalance = parseFloat(user.credits_balance);
      const currentPrice = parseFloat(token.current_price);

      // Calculate transaction costs
      const pricePerToken = currentPrice;
      const totalCost = input.amount * pricePerToken;

      // Validate transaction based on type
      if (input.transaction_type === 'buy') {
        if (userCreditsBalance < totalCost) {
          throw new Error('Insufficient credits for purchase');
        }
      } else { // sell
        if (currentTokenBalance < input.amount) {
          throw new Error('Insufficient token balance for sale');
        }
      }

      // Calculate credits change (negative for buy, positive for sell)
      const creditsChange = input.transaction_type === 'buy' ? -totalCost : totalCost;

      // Update user credits balance
      const newCreditsBalance = userCreditsBalance + creditsChange;
      await trx.update(usersTable)
        .set({ 
          credits_balance: newCreditsBalance.toString(),
          updated_at: new Date()
        })
        .where(eq(usersTable.id, input.user_id))
        .execute();

      // Update user token balance
      const newTokenBalance = input.transaction_type === 'buy' 
        ? currentTokenBalance + input.amount 
        : currentTokenBalance - input.amount;

      if (userTokenBalance.length > 0) {
        // Update existing balance
        await trx.update(userTokenBalancesTable)
          .set({ 
            balance: newTokenBalance.toString(),
            updated_at: new Date()
          })
          .where(and(
            eq(userTokenBalancesTable.user_id, input.user_id),
            eq(userTokenBalancesTable.token_id, input.token_id)
          ))
          .execute();
      } else {
        // Create new balance record
        await trx.insert(userTokenBalancesTable)
          .values({
            user_id: input.user_id,
            token_id: input.token_id,
            balance: newTokenBalance.toString()
          })
          .execute();
      }

      // Record the transaction
      const [transaction] = await trx.insert(transactionsTable)
        .values({
          user_id: input.user_id,
          token_id: input.token_id,
          transaction_type: input.transaction_type,
          amount: input.amount.toString(),
          price_per_token: pricePerToken.toString(),
          total_cost: totalCost.toString(),
          credits_change: creditsChange.toString()
        })
        .returning()
        .execute();

      // Convert numeric fields back to numbers for return
      return {
        ...transaction,
        amount: parseFloat(transaction.amount),
        price_per_token: parseFloat(transaction.price_per_token),
        total_cost: parseFloat(transaction.total_cost),
        credits_change: parseFloat(transaction.credits_change)
      };
    });
  } catch (error) {
    console.error('Token trade failed:', error);
    throw error;
  }
};
