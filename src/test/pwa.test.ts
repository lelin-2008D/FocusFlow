import { describe, it, expect } from 'vitest'
import fs from 'fs'
import path from 'path'

describe('PWA Manifest & Production Readiness', () => {
  it('validates public/manifest.json conforms to W3C Web App Manifest specification', () => {
    const manifestPath = path.resolve(__dirname, '../../public/manifest.json')
    expect(fs.existsSync(manifestPath)).toBe(true)

    const raw = fs.readFileSync(manifestPath, 'utf-8')
    const manifest = JSON.parse(raw)

    expect(manifest.name).toBe('FocusFlow — Smart Reminder & To-Do')
    expect(manifest.short_name).toBe('FocusFlow')
    expect(manifest.display).toBe('standalone')
    expect(manifest.start_url).toBe('./')
    expect(manifest.scope).toBe('./')
    expect(manifest.theme_color).toBe('#0A0F1D')
    expect(manifest.background_color).toBe('#060A13')
    expect(Array.isArray(manifest.icons)).toBe(true)
    expect(manifest.icons.length).toBeGreaterThanOrEqual(2)
  })

  it('validates public/sw.js exists and handles offline fetch & push events', () => {
    const swPath = path.resolve(__dirname, '../../public/sw.js')
    expect(fs.existsSync(swPath)).toBe(true)

    const swContent = fs.readFileSync(swPath, 'utf-8')
    expect(swContent).toContain("addEventListener('install'")
    expect(swContent).toContain("addEventListener('activate'")
    expect(swContent).toContain("addEventListener('fetch'")
    expect(swContent).toContain("addEventListener('push'")
    expect(swContent).toContain("addEventListener('notificationclick'")
  })
})
