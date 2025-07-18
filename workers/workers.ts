import { Worker } from 'worker_threads';
import schedule, { scheduleJob } from 'node-schedule';

scheduleJob('*/5 * * * *', () => {
  console.log('Scheduled task running every 5 minutes');
  const worker = new Worker('./worker.js', {
    workerData: {
      value: 15,
      path: './worker.ts'
    }
  });
});
  
worker.on('message', (result) => {
  console.log(result);
});