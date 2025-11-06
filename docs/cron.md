```typescript
import { CronScheduler } from './cron-scheduler';

const cron = new CronScheduler();

cron.schedule('0 * * * *', () => {
	console.log('⏰ Every hour:', new Date().toLocaleTimeString());
});

cron.schedule('0 3 * * *', () => {
	console.log('🌅 Daily 3AM');
});

cron.schedule('*/5 * * * * *', () => {
	console.log('⚡ Every 5 seconds', new Date().toLocaleTimeString());
});

cron.schedule('* * * * *', () => {
	console.log('⏱️ Every minute:', new Date().toLocaleTimeString());
});

cron.schedule('0/15 * * * *', () => {
	console.log('🕒 Every 15 minutes');
});
```
