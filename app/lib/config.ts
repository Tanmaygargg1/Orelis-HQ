/**
 * Base path for the app.
 *
 * To run at /hub (default):  NEXT_PUBLIC_BASE_PATH=/hub  (or omit the env var)
 * To run at domain root:      NEXT_PUBLIC_BASE_PATH=       (empty string — subdomain deployment)
 * To run at another path:     NEXT_PUBLIC_BASE_PATH=/myapp
 *
 * Change this in .env.local or your hosting environment variables.
 */
export const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH ?? '/hub'
