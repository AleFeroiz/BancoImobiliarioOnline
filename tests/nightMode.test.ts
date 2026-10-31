import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { GAME_BACKGROUND_LIGHT, GAME_BACKGROUND_NIGHT, NIGHT_MODE_STORAGE_KEY, getGameBackgroundColor, readNightMode, saveNightMode } from '../src/ui/nightMode'

describe('modo noturno BANTEC', () => {
  it('restaura e persiste a preferência local sem depender da sala', () => {
    const values = new Map<string, string>()
    const storage = {
      getItem: (key: string) => values.get(key) ?? null,
      setItem: (key: string, value: string) => values.set(key, value),
    }

    expect(readNightMode(storage)).toBe(false)
    saveNightMode(storage, true)
    expect(values.get(NIGHT_MODE_STORAGE_KEY)).toBe('enabled')
    expect(readNightMode(storage)).toBe(true)
    saveNightMode(storage, false)
    expect(readNightMode(storage)).toBe(false)
  })

  it('altera somente a cor do fundo da cena durante a partida', () => {
    expect(getGameBackgroundColor(false)).toBe(GAME_BACKGROUND_LIGHT)
    expect(getGameBackgroundColor(true)).toBe(GAME_BACKGROUND_NIGHT)
  })

  it('continua funcional quando o navegador bloqueia armazenamento local', () => {
    const storage = {
      getItem: () => { throw new Error('storage indisponível') },
      setItem: () => { throw new Error('storage indisponível') },
    }

    expect(readNightMode(storage)).toBe(false)
    expect(() => saveNightMode(storage, true)).not.toThrow()
  })

  it('escurece a home inteira e limita o tema da partida ao fundo fora do tabuleiro', () => {
    const styles = readFileSync(new URL('../src/ui/styles.css', import.meta.url), 'utf8')

    expect(styles).toContain('.screen-home[data-night-mode="true"]')
    expect(styles).toContain('.screen-home[data-night-mode="true"] .entry-card')
    expect(styles).toMatch(/\.screen-game\[data-night-mode="true"\]\{background:#142326\}/)
    expect(styles).not.toContain('.screen-game[data-night-mode="true"] .scene-backdrop')
    expect(styles).not.toContain('.screen-game[data-night-mode="true"] canvas')
  })
})
