import cron from 'node-cron'
import { runScheduledCycle } from './engine.js'

export function startScheduler() {
  const task = cron.schedule('* * * * *', () => {
    void runScheduledCycle().catch((err) => {
      console.error('[Scheduler Error]', err)
    })
  })
  return task
}
