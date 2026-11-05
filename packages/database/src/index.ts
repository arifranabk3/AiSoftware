export * from './mongodb.js';
export * from './init-indexes.js';
export * from './seed.js';
export * from './atlas-diagnostic.js';

// Backward compatibility alias for legacy test runners
export const dbService = {
  connect: async () => ({
    success: false,
    error: 'PostgreSQL disabled. Project migrated to MongoDB.'
  }),
  getStatus: () => ({ isConnected: false })
};
