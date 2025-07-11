
import { useState, useEffect, useCallback } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { trpc } from '@/utils/trpc';
import type { 
  Token, 
  User, 
  CreateTokenInput, 
  CreateUserInput, 
  UserTokenBalance, 
  Transaction, 
  PlatformConfig,
  TradeTokenInput,
  UpdatePlatformConfigInput
} from '../../server/src/schema';

// Default user for demo purposes when backend is not available
const createDemoUser = (): User => ({
  id: 1,
  username: 'demo_user',
  email: 'demo@example.com',
  credits_balance: 10000,
  is_admin: false,
  created_at: new Date(),
  updated_at: new Date()
});

// Demo platform config
const createDemoPlatformConfig = (): PlatformConfig => ({
  id: 1,
  transaction_fee_percentage: 2.5,
  default_token_supply: 1000000,
  default_token_price: 0.001,
  ethereum_rpc_url: null,
  mainnet_rpc_url: null,
  created_at: new Date(),
  updated_at: new Date()
});

// Demo tokens for showcase
const createDemoTokens = (): Token[] => [
  {
    id: 1,
    name: 'Demo Token',
    symbol: 'DEMO',
    description: 'A demonstration token showing platform capabilities',
    initial_supply: 1000000,
    current_supply: 1000000,
    current_price: 0.001,
    creator_id: 1,
    status: 'active' as const,
    created_at: new Date(),
    updated_at: new Date()
  },
  {
    id: 2,
    name: 'Example Coin',
    symbol: 'EXP',
    description: 'Another example token for testing trading features',
    initial_supply: 500000,
    current_supply: 500000,
    current_price: 0.005,
    creator_id: 1,
    status: 'active' as const,
    created_at: new Date(),
    updated_at: new Date()
  }
];

function App() {
  const [tokens, setTokens] = useState<Token[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [userTokens, setUserTokens] = useState<UserTokenBalance[]>([]);
  const [userTransactions, setUserTransactions] = useState<Transaction[]>([]);
  const [platformConfig, setPlatformConfig] = useState<PlatformConfig | null>(null);
  const [selectedToken, setSelectedToken] = useState<Token | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isServerAvailable, setIsServerAvailable] = useState(true);

  // Token Creation Form State
  const [tokenForm, setTokenForm] = useState<CreateTokenInput>({
    name: '',
    symbol: '',
    description: null,
    initial_supply: 1000000,
    creator_id: 1
  });

  // User Creation Form State
  const [userForm, setUserForm] = useState<CreateUserInput>({
    username: '',
    email: '',
    credits_balance: 1000,
    is_admin: false
  });

  // Trading Form State
  const [tradeForm, setTradeForm] = useState<TradeTokenInput>({
    user_id: 1,
    token_id: 0,
    transaction_type: 'buy',
    amount: 0
  });

  // Platform Config Form State
  const [configForm, setConfigForm] = useState<UpdatePlatformConfigInput>({
    transaction_fee_percentage: 2.5,
    default_token_supply: 1000000,
    default_token_price: 0.001,
    ethereum_rpc_url: null,
    mainnet_rpc_url: null
  });

  // Load data with fallbacks
  const loadCurrentUser = useCallback(async () => {
    try {
      const allUsers = await trpc.getUsers.query();
      if (allUsers.length > 0) {
        const user = allUsers[0];
        setCurrentUser(user);
        setTokenForm(prev => ({ ...prev, creator_id: user.id }));
        setTradeForm(prev => ({ ...prev, user_id: user.id }));
      } else {
        try {
          const demoUser = await trpc.createUser.mutate({
            username: 'demo_user',
            email: 'demo@example.com',
            credits_balance: 10000,
            is_admin: false
          });
          setCurrentUser(demoUser);
          setTokenForm(prev => ({ ...prev, creator_id: demoUser.id }));
          setTradeForm(prev => ({ ...prev, user_id: demoUser.id }));
        } catch {
          // If we can't create user, use demo user
          const demoUser = createDemoUser();
          setCurrentUser(demoUser);
          setTokenForm(prev => ({ ...prev, creator_id: demoUser.id }));
          setTradeForm(prev => ({ ...prev, user_id: demoUser.id }));
          setIsServerAvailable(false);
        }
      }
    } catch (err) {
      console.error('Server not available, using demo user:', err);
      const demoUser = createDemoUser();
      setCurrentUser(demoUser);
      setTokenForm(prev => ({ ...prev, creator_id: demoUser.id }));
      setTradeForm(prev => ({ ...prev, user_id: demoUser.id }));
      setIsServerAvailable(false);
    }
  }, []);

  const loadTokens = useCallback(async () => {
    try {
      const result = await trpc.getTokens.query();
      setTokens(result);
    } catch (err) {
      console.error('Failed to load tokens, using demo data:', err);
      setTokens(createDemoTokens());
      setIsServerAvailable(false);
    }
  }, []);

  const loadUsers = useCallback(async () => {
    try {
      const result = await trpc.getUsers.query();
      setUsers(result);
    } catch (err) {
      console.error('Failed to load users, using demo data:', err);
      setUsers([createDemoUser()]);
      setIsServerAvailable(false);
    }
  }, []);

  const loadUserTokens = useCallback(async () => {
    if (!currentUser) return;
    try {
      const result = await trpc.getUserTokens.query({ user_id: currentUser.id });
      setUserTokens(result);
    } catch (err) {
      console.error('Failed to load user tokens:', err);
      setUserTokens([]);
      setIsServerAvailable(false);
    }
  }, [currentUser]);

  const loadUserTransactions = useCallback(async () => {
    if (!currentUser) return;
    try {
      const result = await trpc.getUserTransactions.query({ user_id: currentUser.id });
      setUserTransactions(result);
    } catch (err) {
      console.error('Failed to load user transactions:', err);
      setUserTransactions([]);
      setIsServerAvailable(false);
    }
  }, [currentUser]);

  const loadPlatformConfig = useCallback(async () => {
    try {
      const result = await trpc.getPlatformConfig.query();
      setPlatformConfig(result);
      setConfigForm({
        transaction_fee_percentage: result.transaction_fee_percentage,
        default_token_supply: result.default_token_supply,
        default_token_price: result.default_token_price,
        ethereum_rpc_url: result.ethereum_rpc_url,
        mainnet_rpc_url: result.mainnet_rpc_url
      });
    } catch (err) {
      console.error('Failed to load platform config, using demo data:', err);
      const demoConfig = createDemoPlatformConfig();
      setPlatformConfig(demoConfig);
      setConfigForm({
        transaction_fee_percentage: demoConfig.transaction_fee_percentage,
        default_token_supply: demoConfig.default_token_supply,
        default_token_price: demoConfig.default_token_price,
        ethereum_rpc_url: demoConfig.ethereum_rpc_url,
        mainnet_rpc_url: demoConfig.mainnet_rpc_url
      });
      setIsServerAvailable(false);
    }
  }, []);

  useEffect(() => {
    loadCurrentUser();
    loadTokens();
    loadUsers();
    loadPlatformConfig();
  }, [loadCurrentUser, loadTokens, loadUsers, loadPlatformConfig]);

  useEffect(() => {
    if (currentUser) {
      loadUserTokens();
      loadUserTransactions();
    }
  }, [currentUser, loadUserTokens, loadUserTransactions]);

  // Token Creation Handler
  const handleCreateToken = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    
    setIsLoading(true);
    setError(null);
    try {
      if (isServerAvailable) {
        const result = await trpc.createToken.mutate({
          ...tokenForm,
          creator_id: currentUser.id
        });
        setTokens((prev: Token[]) => [...prev, result]);
      } else {
        // Create demo token when server is not available
        const newToken: Token = {
          id: tokens.length + 1,
          name: tokenForm.name,
          symbol: tokenForm.symbol,
          description: tokenForm.description,
          initial_supply: tokenForm.initial_supply,
          current_supply: tokenForm.initial_supply,
          current_price: 0.001,
          creator_id: currentUser.id,
          status: 'active' as const,
          created_at: new Date(),
          updated_at: new Date()
        };
        setTokens((prev: Token[]) => [...prev, newToken]);
      }
      
      setTokenForm({
        name: '',
        symbol: '',
        description: null,
        initial_supply: 1000000,
        creator_id: currentUser.id
      });
    } catch (err) {
      console.error('Failed to create token:', err);
      setError('Failed to create token. Server may be unavailable.');
    } finally {
      setIsLoading(false);
    }
  };

  // User Creation Handler
  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    try {
      if (isServerAvailable) {
        const result = await trpc.createUser.mutate(userForm);
        setUsers((prev: User[]) => [...prev, result]);
      } else {
        // Create demo user when server is not available
        const newUser: User = {
          id: users.length + 1,
          username: userForm.username,
          email: userForm.email,
          credits_balance: userForm.credits_balance,
          is_admin: userForm.is_admin,
          created_at: new Date(),
          updated_at: new Date()
        };
        setUsers((prev: User[]) => [...prev, newUser]);
      }
      
      setUserForm({
        username: '',
        email: '',
        credits_balance: 1000,
        is_admin: false
      });
    } catch (err) {
      console.error('Failed to create user:', err);
      setError('Failed to create user. Server may be unavailable.');
    } finally {
      setIsLoading(false);
    }
  };

  // Trading Handler
  const handleTrade = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedToken || !currentUser) return;
    
    setIsLoading(true);
    setError(null);
    try {
      if (isServerAvailable) {
        await trpc.tradeToken.mutate({
          ...tradeForm,
          user_id: currentUser.id,
          token_id: selectedToken.id
        });
        await loadUserTokens();
        await loadUserTransactions();
      } else {
        // Simulate trade when server is not available
        const tradeCost = tradeForm.amount * selectedToken.current_price;
        if (tradeForm.transaction_type === 'buy' && tradeCost > currentUser.credits_balance) {
          setError('Insufficient credits for this trade');
          return;
        }
        
        // Create demo transaction
        const newTransaction: Transaction = {
          id: userTransactions.length + 1,
          user_id: currentUser.id,
          token_id: selectedToken.id,
          transaction_type: tradeForm.transaction_type,
          amount: tradeForm.amount,
          price_per_token: selectedToken.current_price,
          total_cost: tradeCost,
          credits_change: tradeForm.transaction_type === 'buy' ? -tradeCost : tradeCost,
          created_at: new Date()
        };
        
        setUserTransactions((prev: Transaction[]) => [...prev, newTransaction]);
        
        // Update user credits
        const creditsChange = tradeForm.transaction_type === 'buy' ? -tradeCost : tradeCost;
        setCurrentUser(prev => prev ? { ...prev, credits_balance: prev.credits_balance + creditsChange } : null);
      }
      
      setTradeForm({
        user_id: currentUser.id,
        token_id: 0,
        transaction_type: 'buy',
        amount: 0
      });
    } catch (err) {
      console.error('Failed to execute trade:', err);
      setError('Failed to execute trade. Server may be unavailable.');
    } finally {
      setIsLoading(false);
    }
  };

  // Platform Config Update Handler
  const handleUpdateConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    try {
      if (isServerAvailable) {
        const result = await trpc.updatePlatformConfig.mutate(configForm);
        setPlatformConfig(result);
      } else {
        // Update demo config when server is not available
        const updatedConfig: PlatformConfig = {
          ...platformConfig!,
          transaction_fee_percentage: configForm.transaction_fee_percentage ?? 2.5,
          default_token_supply: configForm.default_token_supply ?? 1000000,
          default_token_price: configForm.default_token_price ?? 0.001,
          ethereum_rpc_url: configForm.ethereum_rpc_url ?? null,
          mainnet_rpc_url: configForm.mainnet_rpc_url ?? null,
          updated_at: new Date()
        };
        setPlatformConfig(updatedConfig);
      }
    } catch (err) {
      console.error('Failed to update platform config:', err);
      setError('Failed to update platform config. Server may be unavailable.');
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'paused': return 'bg-yellow-100 text-yellow-800';
      case 'inactive': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (!currentUser) {
    return (
      <div className="container mx-auto p-4">
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-4">🚀 Token Launch Platform</h2>
            <p className="text-gray-600">Setting up your account...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">🚀 Token Launch Platform</h1>
          <p className="text-gray-600">Create, trade, and manage tokens</p>
        </div>
        <div className="text-right">
          <p className="text-sm text-gray-500">Welcome, {currentUser.username}</p>
          <p className="text-lg font-semibold">💳 {currentUser.credits_balance.toLocaleString()} Credits</p>
        </div>
      </div>

      {!isServerAvailable && (
        <Alert>
          <AlertDescription>
            🔧 Demo Mode: Backend server is not available. Using simulated data for demonstration.
          </AlertDescription>
        </Alert>
      )}

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="tokens" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="tokens">🪙 Tokens</TabsTrigger>
          <TabsTrigger value="create">➕ Create Token</TabsTrigger>
          <TabsTrigger value="wallet">💼 My Wallet</TabsTrigger>
          <TabsTrigger value="admin" disabled={!currentUser.is_admin}>👑 Admin</TabsTrigger>
          <TabsTrigger value="config" disabled={!currentUser.is_admin}>⚙️ Config</TabsTrigger>
        </TabsList>

        {/* Token Listing Page */}
        <TabsContent value="tokens" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>📈 Token Marketplace</CardTitle>
              <CardDescription>Browse and trade available tokens</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4">
                {tokens.length === 0 ? (
                  <p className="text-center text-gray-500 py-8">No tokens available yet. Create the first one!</p>
                ) : (
                  tokens.map((token: Token) => (
                    <Card key={token.id} className="p-4">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h3 className="text-lg font-semibold">{token.name}</h3>
                          <p className="text-sm text-gray-600">{token.symbol}</p>
                        </div>
                        <Badge className={getStatusColor(token.status)}>
                          {token.status}
                        </Badge>
                      </div>
                      
                      {token.description && (
                        <p className="text-sm text-gray-700 mb-3">{token.description}</p>
                      )}
                      
                      <div className="grid grid-cols-2 gap-4 mb-3">
                        <div>
                          <p className="text-xs text-gray-500">Current Price</p>
                          <p className="text-lg font-bold">${token.current_price.toFixed(6)}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Supply</p>
                          <p className="text-lg font-bold">{token.current_supply.toLocaleString()}</p>
                        </div>
                      </div>
                      
                      <div className="flex gap-2">
                        <Button 
                          onClick={() => setSelectedToken(token)}
                          variant="outline"
                          size="sm"
                        >
                          📊 View Details
                        </Button>
                        <Button 
                          onClick={() => {
                            setSelectedToken(token);
                            setTradeForm(prev => ({ ...prev, token_id: token.id }));
                          }}
                          size="sm"
                        >
                          💰 Trade
                        </Button>
                      </div>
                    </Card>
                  ))
                )}
              </div>
            </CardContent>
          </Card>

          {/* Token Details Modal */}
          {selectedToken && (
            <Card>
              <CardHeader>
                <CardTitle>🔍 Token Details: {selectedToken.name}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <Label>Symbol</Label>
                    <p className="font-semibold">{selectedToken.symbol}</p>
                  </div>
                  <div>
                    <Label>Status</Label>
                    <Badge className={getStatusColor(selectedToken.status)}>
                      {selectedToken.status}
                    </Badge>
                  </div>
                  <div>
                    <Label>Current Price</Label>
                    <p className="font-semibold">${selectedToken.current_price.toFixed(6)}</p>
                  </div>
                  <div>
                    <Label>Current Supply</Label>
                    <p className="font-semibold">{selectedToken.current_supply.toLocaleString()}</p>
                  </div>
                </div>
                
                {selectedToken.description && (
                  <div className="mb-4">
                    <Label>Description</Label>
                    <p className="text-sm text-gray-700">{selectedToken.description}</p>
                  </div>
                )}

                <Separator className="my-4" />

                {/* Trading Interface */}
                <div className="space-y-4">
                  <h4 className="font-semibold">💱 Quick Trade</h4>
                  <form onSubmit={handleTrade} className="space-y-3">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="trade-type">Transaction Type</Label>
                        <Select 
                          value={tradeForm.transaction_type || 'buy'} 
                          onValueChange={(value: 'buy' | 'sell') => 
                            setTradeForm(prev => ({ ...prev, transaction_type: value }))
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select transaction type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="buy">🟢 Buy</SelectItem>
                            <SelectItem value="sell">🔴 Sell</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="trade-amount">Amount</Label>
                        <Input
                          id="trade-amount"
                          type="number"
                          value={tradeForm.amount}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                            setTradeForm(prev => ({ ...prev, amount: parseFloat(e.target.value) || 0 }))
                          }
                          placeholder="Amount to trade"
                          min="0"
                          step="0.000001"
                          required
                        />
                      </div>
                    </div>
                    
                    <div className="flex justify-between text-sm text-gray-600">
                      <span>Estimated Cost: ${(tradeForm.amount * selectedToken.current_price).toFixed(6)}</span>
                      <span>Your Balance: {currentUser.credits_balance.toLocaleString()} Credits</span>
                    </div>
                    
                    <div className="flex gap-2">
                      <Button type="submit" disabled={isLoading}>
                        {isLoading ? 'Processing...' : `${tradeForm.transaction_type === 'buy' ? '🟢 Buy' : '🔴 Sell'} ${selectedToken.symbol}`}
                      </Button>
                      <Button type="button" variant="outline" onClick={() => setSelectedToken(null)}>
                        Cancel
                      </Button>
                    </div>
                  </form>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Token Creation Form */}
        <TabsContent value="create" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>🏗️ Create New Token</CardTitle>
              <CardDescription>Launch your own token with custom parameters</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCreateToken} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="token-name">Token Name</Label>
                    <Input
                      id="token-name"
                      value={tokenForm.name}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setTokenForm(prev => ({ ...prev, name: e.target.value }))
                      }
                      placeholder="e.g., My Awesome Token"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="token-symbol">Symbol</Label>
                    <Input
                      id="token-symbol"
                      value={tokenForm.symbol}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setTokenForm(prev => ({ ...prev, symbol: e.target.value.toUpperCase() }))
                      }
                      placeholder="e.g., MAT"
                      maxLength={10}
                      required
                    />
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="token-description">Description (Optional)</Label>
                  <Textarea
                    id="token-description"
                    value={tokenForm.description || ''}
                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                      setTokenForm(prev => ({ ...prev, description: e.target.value || null }))
                    }
                    placeholder="Describe your token's purpose and features..."
                    rows={3}
                  />
                </div>
                
                <div>
                  <Label htmlFor="initial-supply">Initial Supply</Label>
                  <Input
                    id="initial-supply"
                    type="number"
                    value={tokenForm.initial_supply}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setTokenForm(prev => ({ ...prev, initial_supply: parseFloat(e.target.value) || 0 }))
                    }
                    placeholder="1000000"
                    min="1"
                    required
                  />
                </div>
                
                <Button type="submit" disabled={isLoading} className="w-full">
                  {isLoading ? 'Creating Token...' : '🚀 Launch Token'}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* User Wallet/Dashboard */}
        <TabsContent value="wallet" className="space-y-4">
          <div className="grid gap-4">
            <Card>
              <CardHeader>
                <CardTitle>💼 My Wallet</CardTitle>
                <CardDescription>Your token balances and transaction history</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="p-4 bg-blue-50 rounded-lg">
                    <h3 className="font-semibold text-blue-900">Credits Balance</h3>
                    <p className="text-2xl font-bold text-blue-700">{currentUser.credits_balance.toLocaleString()} Credits</p>
                  </div>
                  
                  <div>
                    <h3 className="font-semibold mb-2">🪙 Token Holdings</h3>
                    {userTokens.length === 0 ? (
                      <p className="text-gray-500 text-center py-4">No token holdings yet. Start trading to build your portfolio!</p>
                    ) : (
                      <div className="space-y-2">
                        {userTokens.map((balance: UserTokenBalance) => (
                          <div key={balance.id} className="flex justify-between items-center p-3 border rounded-lg">
                            <div>
                              <p className="font-medium">Token ID: {balance.token_id}</p>
                              <p className="text-sm text-gray-600">Balance: {balance.balance.toLocaleString()}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>📊 Transaction History</CardTitle>
              </CardHeader>
              <CardContent>
                {userTransactions.length === 0 ? (
                  <p className="text-gray-500 text-center py-4">No transactions yet. Start trading to see your history!</p>
                ) : (
                  <div className="space-y-2">
                    {userTransactions.map((transaction: Transaction) => (
                      <div key={transaction.id} className="flex justify-between items-center p-3 border rounded-lg">
                        <div>
                          <p className="font-medium">
                            {transaction.transaction_type === 'buy' ? '🟢 Buy' : '🔴 Sell'} 
                            {' '}{transaction.amount.toLocaleString()} tokens
                          </p>
                          <p className="text-sm text-gray-600">
                            ${transaction.price_per_token.toFixed(6)} per token
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold">${transaction.total_cost.toFixed(2)}</p>
                          <p className="text-sm text-gray-600">
                            {transaction.created_at.toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Admin Panel */}
        <TabsContent value="admin" className="space-y-4">
          <div className="grid gap-4">
            <Card>
              <CardHeader>
                <CardTitle>👑 Admin Panel</CardTitle>
                <CardDescription>Manage users and tokens</CardDescription>
              
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="users" className="w-full">
                  <TabsList>
                    <TabsTrigger value="users">Users</TabsTrigger>
                    <TabsTrigger value="tokens">Tokens</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="users" className="space-y-4">
                    <div className="flex justify-between items-center">
                      <h3 className="font-semibold">User Management</h3>
                    </div>
                    
                    <Card>
                      <CardHeader>
                        <CardTitle>Create New User</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <form onSubmit={handleCreateUser} className="space-y-4">
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <Label htmlFor="username">Username</Label>
                              <Input
                                id="username"
                                value={userForm.username}
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                                  setUserForm(prev => ({ ...prev, username: e.target.value }))
                                }
                                required
                              />
                            </div>
                            <div>
                              <Label htmlFor="email">Email</Label>
                              <Input
                                id="email"
                                type="email"
                                value={userForm.email}
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                                  setUserForm(prev => ({ ...prev, email: e.target.value }))
                                }
                                required
                              />
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <Label htmlFor="credits">Initial Credits</Label>
                              <Input
                                id="credits"
                                type="number"
                                value={userForm.credits_balance}
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                                  setUserForm(prev => ({ ...prev, credits_balance: parseFloat(e.target.value) || 0 }))
                                }
                                min="0"
                              />
                            </div>
                            <div className="flex items-center space-x-2">
                              <Switch
                                id="is-admin"
                                checked={userForm.is_admin}
                                onCheckedChange={(checked: boolean) =>
                                  setUserForm(prev => ({ ...prev, is_admin: checked }))
                                }
                              />
                              <Label htmlFor="is-admin">Admin User</Label>
                            </div>
                          </div>
                          <Button type="submit" disabled={isLoading}>
                            {isLoading ? 'Creating...' : 'Create User'}
                          </Button>
                        </form>
                      </CardContent>
                    </Card>
                    
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Username</TableHead>
                          <TableHead>Email</TableHead>
                          <TableHead>Credits</TableHead>
                          <TableHead>Admin</TableHead>
                          <TableHead>Created</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {users.map((user: User) => (
                          <TableRow key={user.id}>
                            <TableCell className="font-medium">{user.username}</TableCell>
                            <TableCell>{user.email}</TableCell>
                            <TableCell>{user.credits_balance.toLocaleString()}</TableCell>
                            <TableCell>
                              {user.is_admin ? (
                                <Badge className="bg-purple-100 text-purple-800">Admin</Badge>
                              ) : (
                                <Badge variant="secondary">User</Badge>
                              )}
                            </TableCell>
                            <TableCell>{user.created_at.toLocaleDateString()}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TabsContent>
                  
                  <TabsContent value="tokens" className="space-y-4">
                    <h3 className="font-semibold">Token Management</h3>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Name</TableHead>
                          <TableHead>Symbol</TableHead>
                          <TableHead>Price</TableHead>
                          <TableHead>Supply</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Created</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {tokens.map((token: Token) => (
                          <TableRow key={token.id}>
                            <TableCell className="font-medium">{token.name}</TableCell>
                            <TableCell>{token.symbol}</TableCell>
                            <TableCell>${token.current_price.toFixed(6)}</TableCell>
                            <TableCell>{token.current_supply.toLocaleString()}</TableCell>
                            <TableCell>
                              <Badge className={getStatusColor(token.status)}>
                                {token.status}
                              </Badge>
                            </TableCell>
                            <TableCell>{token.created_at.toLocaleDateString()}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Platform Configuration */}
        <TabsContent value="config" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>⚙️ Platform Configuration</CardTitle>
              <CardDescription>Manage platform-wide settings</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleUpdateConfig} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="fee-percentage">Transaction Fee (%)</Label>
                    <Input
                      id="fee-percentage"
                      type="number"
                      value={configForm.transaction_fee_percentage}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setConfigForm(prev => ({ ...prev, transaction_fee_percentage: parseFloat(e.target.value) || 0 }))
                      }
                      min="0"
                      max="100"
                      step="0.1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="default-price">Default Token Price</Label>
                    <Input
                      id="default-price"
                      type="number"
                      value={configForm.default_token_price}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setConfigForm(prev => ({ ...prev, default_token_price: parseFloat(e.target.value) || 0 }))
                      }
                      min="0"
                      step="0.000001"
                    />
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="default-supply">Default Token Supply</Label>
                  <Input
                    id="default-supply"
                    type="number"
                    value={configForm.default_token_supply}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setConfigForm(prev => ({ ...prev, default_token_supply: parseFloat(e.target.value) || 0 }))
                    }
                    min="1"
                  />
                </div>
                
                <Separator />
                
                <div className="space-y-4">
                  <h4 className="font-semibold">🔗 Blockchain RPC URLs</h4>
                  <p className="text-sm text-gray-600">
                    These URLs will be used for future blockchain integration. 
                    Note: Actual blockchain connectivity is not implemented yet.
                  </p>
                  
                  <div>
                    <Label htmlFor="ethereum-rpc">Ethereum RPC URL</Label>
                    <Input
                      id="ethereum-rpc"
                      value={configForm.ethereum_rpc_url || ''}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setConfigForm(prev => ({ ...prev, ethereum_rpc_url: e.target.value || null }))
                      }
                      placeholder="https://mainnet.infura.io/v3/YOUR-PROJECT-ID"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="mainnet-rpc">Mainnet RPC URL</Label>
                    <Input
                      id="mainnet-rpc"
                      value={configForm.mainnet_rpc_url || ''}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setConfigForm(prev => ({ ...prev, mainnet_rpc_url: e.target.value || null }))
                      }
                      placeholder="https://eth-mainnet.g.alchemy.com/v2/YOUR-API-KEY"
                    />
                  </div>
                </div>
                
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? 'Updating...' : 'Update Configuration'}
                </Button>
              </form>
            </CardContent>
          </Card>
          
          {platformConfig && (
            <Card>
              <CardHeader>
                <CardTitle>📊 Current Configuration</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Transaction Fee</p>
                    <p className="font-semibold">{platformConfig.transaction_fee_percentage}%</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Default Token Price</p>
                    <p className="font-semibold">${platformConfig.default_token_price.toFixed(6)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Default Supply</p>
                    <p className="font-semibold">{platformConfig.default_token_supply.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Last Updated</p>
                    <p className="font-semibold">{platformConfig.updated_at.toLocaleDateString()}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default App;
