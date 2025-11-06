```typescript
import { SappsJS } from 'sappsjs';
const app = new SappsJS({
	routes: {
		'/api/posts': {
			GET: () => Response.json({ posts: [] }),
			POST: [
				[jsonBodyMiddleware, validateBodyMiddleware({ title: 'string' })],
				(req) => Response.json({ created: true })
			]
		},
		'/api/posts/:id': {
			GET: (req) => Response.json({ id: req.params?.id }),
			DELETE: [[authMiddleware], (req) => Response.json({ deleted: true })]
		}
	}
});
const server = await app.serve();
console.log(`🚀 Server running at ${server.url}`);
```

```typescript
import { SappsJS } from 'sappsjs';
const app = new SappsJS({
	cors: {
		origin: ['http://localhost:3000', 'http://localhost:5173'],
		credentials: true,
		maxAge: 3600
	},
	globalMiddlewares: [loggingMiddleware],
	routes: {
		'/api/posts': {
			GET: () => Response.json({ posts: [] }),
			POST: [
				[jsonBodyMiddleware, validateBodyMiddleware({ title: 'string' })],
				(req) => Response.json({ created: true })
			]
		},
		'/api/posts/:id': {
			GET: (req) => Response.json({ id: req.params?.id }),
			DELETE: [[authMiddleware], (req) => Response.json({ deleted: true })]
		}
	},
	websocket: {
		'/ws/chats': {
			open(ws) {
				ws.send('Hola');
			},
			message(ws, message) {
				ws.send(`Echo: ${message}`);
			}
		},
		'/ws/stats': {
			open(ws) {
				ws.send('Stats conectados');
			}
		}
	},
	static: {
		'/': {
			path: 'web',
			fallback: 'index.html',
			index: 'index.html',
			maxAge: 3600
		},

		'/public': {
			path: 'public',
			maxAge: 86400,
			immutable: true
		},

		'/private': [
			[jwtMiddleware],
			{
				path: 'private',
				maxAge: 0
			}
		],

		'/docs': [
			[validateToken],
			{
				path: 'docs'
			}
		]
	}
});
const server = await app.serve();
console.log(`🚀 Server running at ${server.url}`);
```
