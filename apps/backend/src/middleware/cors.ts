/**
 * CORS middleware — allows only known frontend origins.
 * Reads FRONTEND_ORIGIN env var (comma-separated list).
 *
 * In development: also allows http://localhost:5173 (Vite dev server)
 */
import cors from 'cors';
import { allowedOrigins } from '../config';

// Always include localhost dev server
const devOrigins = ['http://localhost:5173', 'http://localhost:5174'];
const allAllowed = Array.from(new Set([...allowedOrigins, ...devOrigins]));

export const corsMiddleware = cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (server-to-server, Postman, Railway healthcheck)
    if (!origin) return callback(null, true);
    if (allAllowed.includes(origin)) return callback(null, true);
    callback(new Error(`Origin ${origin} not allowed by CORS`));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
});
