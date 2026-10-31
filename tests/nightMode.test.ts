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
    expect(styles).toContain('.screen-home[data-night-mode="true"] .mode-tab.selected{border-color:#c7ad5e;background:#35483d')
    expect(styles).toContain('.screen-room[data-night-mode="true"] .lobby-duration-option[aria-pressed="true"]')
    expect(styles).toMatch(/\.screen-game\[data-night-mode="true"\]\{background:#142326\}/)
    expect(styles).not.toContain('.screen-game[data-night-mode="true"] .scene-backdrop')
    expect(styles).not.toContain('.screen-game[data-night-mode="true"] canvas')
  })

  it('mantém os quatro atalhos quadrados e alinhados à lateral em desktop e celular', () => {
    const styles = readFileSync(new URL('../src/ui/styles.css', import.meta.url), 'utf8')

    expect(styles).toMatch(/\.game-quick-actions\{--quick-action-size:56px;position:fixed;z-index:7;top:50%;right:16px/)
    expect(styles).toContain('grid-template-rows:repeat(4,var(--quick-action-size))')
    expect(styles).toContain('width:var(--quick-action-size);height:var(--quick-action-size)')
    expect(styles).toMatch(/\.game-quick-actions\{--quick-action-size:48px;top:50%;right:8px/)
    expect(styles).toContain('.game-quick-actions .emote-picker{top:50%;right:calc(100% + 8px)')
  })
})
