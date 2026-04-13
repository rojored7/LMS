import { setupServer } from 'msw/node';
import { handlers, errorHandlers } from './handlers';

// Setup mock server for testing
export const server = setupServer(...handlers);

// Helper to use error handlers for testing error scenarios
export function useErrorHandlers() {
  server.use(...errorHandlers);
}

// Helper to add custom handlers for specific tests
export function useCustomHandlers(...customHandlers: any[]) {
  server.use(...customHandlers);
}

export default server;