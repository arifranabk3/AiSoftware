export * from './mongodb.js';
export * from './init-indexes.js';
export * from './seed.js';
export * from './models.js';
export * from './repositories.js';
export * from './activity.repository.js';
export * from './revenue.repository.js';
export * from './storefront.repository.js';


// Backward compatibility alias for legacy test runners
export const dbService = {
  connect: async () => ({
    success: false,
    error: 'PostgreSQL disabled. Project migrated to MongoDB.'
  }),
  getStatus: () => ({ isConnected: false })
};
