import 'fake-indexeddb/auto'
import '@testing-library/jest-dom'

// Mock AudioContext for Web Audio API in Node/jsdom
class MockAudioContext {
  currentTime = 0
  state = 'running'
  createOscillator() {
    return {
      type: 'sine',
      frequency: {
        setValueAtTime: () => {},
        exponentialRampToValueAtTime: () => {},
      },
      connect: () => {},
      start: () => {},
      stop: () => {},
    }
  }
  createGain() {
    return {
      gain: {
        setValueAtTime: () => {},
        linearRampToValueAtTime: () => {},
        exponentialRampToValueAtTime: () => {},
      },
      connect: () => {},
    }
  }
  destination = {}
  resume() {
    return Promise.resolve()
  }
}

;(window as any).AudioContext = MockAudioContext
;(window as any).webkitAudioContext = MockAudioContext
