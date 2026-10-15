import { describe, it, expect, vi } from 'vitest'
import { pushManager } from '../services/pushManager'

describe('PushManagerService', () => {
  it('detects push capability and reports current permission status', async () => {
    const status = await pushManager.getStatus()
    expect(status).toBeDefined()
    expect(typeof status.isSupported).toBe('boolean')
    expect(status.permission).toBeDefined()
  })

  it('rejects subscription cleanly if VAPID public key is missing or placeholder', async () => {
    vi.spyOn(pushManager, 'isPushSupported').mockReturnValue(true)

    // Should throw explicit configuration error instead of failing silently
    await expect(pushManager.subscribe('your-vapid-public-key-here')).rejects.toThrow(
      /VAPID Public Key is not configured/
    )
  })
})
