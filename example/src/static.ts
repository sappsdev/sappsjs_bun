import type { StaticRoutes } from "sappsjs/types";

export const staticRoutes: StaticRoutes = {
  '/public': {
			path: 'public',
			maxAge: 86400,
			immutable: true
		},
}
