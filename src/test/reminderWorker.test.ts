import { describe, it, expect } from 'vitest'
import { ReminderWorker } from '../../server/reminderWorker'

describe('Server Reminder Worker', () => {
  it('instantiates worker cleanly and safely handles unconfigured dry-run environments', async () => {
    const worker = new ReminderWorker({
      supabaseUrl: '',
      supabaseServiceKey: '',
      vapidPublicKey: '',
      vapidPrivateKey: '',
      vapidSubject: '',
    })

    const result = await worker.processBatch()
    expect(result).toEqual({
      claimed: 0,
      delivered: 0,
      suppressed: 0,
      expired: 0,
      failed: 0,
    })
  })
})
