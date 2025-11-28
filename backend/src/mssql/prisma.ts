import { PrismaClient } from '@prisma/client';
import { AsyncLocalStorage } from 'async_hooks';

// Context to store the current user role
type PrismaContext = {
  role: string;
};

export const prismaStorage = new AsyncLocalStorage<PrismaContext>();

// Helper to create clients with specific connection strings
const createClient = (url?: string) => {
  // If no specific URL is provided, it falls back to the default DATABASE_URL
  // In a real deployment, ensure DATABASE_URL_BUYER, etc. are set in .env
  return new PrismaClient({
    datasources: {
      db: {
        url: url || process.env.DATABASE_URL,
      },
    },
  });
};

// Initialize clients for different roles
const clients: Record<string, PrismaClient> = {
  default: createClient(process.env.DATABASE_URL),
  buyer: createClient(process.env.DATABASE_URL_BUYER || process.env.DATABASE_URL),
  seller: createClient(process.env.DATABASE_URL_SELLER || process.env.DATABASE_URL),
  admin: createClient(process.env.DATABASE_URL_ADMIN || process.env.DATABASE_URL),
};

// Function to get the correct client based on the current ALS context
const getClient = (): PrismaClient => {
  const store = prismaStorage.getStore();
  const role = store?.role;

  if (role === 'B') return clients.buyer;
  if (role === 'S') return clients.seller;
  if (role === 'A') return clients.admin;
  
  return clients.default;
};

// Proxy to delegate property access to the correct client instance
const prisma = new Proxy({} as PrismaClient, {
  get: (_target, prop) => {
    const client = getClient();
    // Return the property from the selected client
    // We need to bind methods to the client instance to ensure 'this' context is correct
    const value = (client as any)[prop];
    if (typeof value === 'function') {
      return value.bind(client);
    }
    return value;
  },
});

export default prisma;
