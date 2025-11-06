```typescript
import { CronScheduler } from './cron-scheduler';

const cron = new CronScheduler();

// Ejecutar cada hora en el minuto 0
cron.schedule('0 * * * *', () => {
	console.log('⏰ Ejecutado cada hora:', new Date().toLocaleTimeString());
});

// Ejecutar todos los días a las 3 AM
cron.schedule('0 3 * * *', () => {
	console.log('🌅 Ejecutado diariamente a las 3 AM');
});

// Ejecutar cada 5 segundos
cron.schedule('*/5 * * * * *', () => {
	console.log('⚡ Cada 5 segundos', new Date().toLocaleTimeString());
});

// Cada minuto
cron.schedule('* * * * *', () => {
	console.log('⏱️ Ejecutado cada minuto:', new Date().toLocaleTimeString());
});

// Ejecutar en minutos específicos (0, 15, 30 y 45)
cron.schedule('0/15 * * * *', () => {
	console.log('🕒 Cada 15 minutos');
});
```
