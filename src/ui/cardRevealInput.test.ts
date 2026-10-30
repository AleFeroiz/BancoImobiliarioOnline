import { describe, expect, it, vi } from 'vitest'
import { dismissCardRevealOnPointerDown } from './cardRevealInput'

describe('dispensar carta', () => {
  it('fecha ao pressionar qualquer área e impede a ação do tabuleiro por baixo', () => {
    const event = { preventDefault: vi.fn(), stopPropagation: vi.fn() }
    const dismiss = vi.fn()

    expect(dismissCardRevealOnPointerDown(event, true, dismiss)).toBe(true)
    expect(event.preventDefault).toHaveBeenCalledOnce()
    expect(event.stopPropagation).toHaveBeenCalledOnce()
    expect(dismiss).toHaveBeenCalledOnce()
  })

  it('não intercepta o ponteiro quando não há carta aberta', () => {
    const event = { preventDefault: vi.fn(), stopPropagation: vi.fn() }
    const dismiss = vi.fn()

    expect(dismissCardRevealOnPointerDown(event, false, dismiss)).toBe(false)
    expect(event.preventDefault).not.toHaveBeenCalled()
    expect(event.stopPropagation).not.toHaveBeenCalled()
    expect(dismiss).not.toHaveBeenCalled()
  })
})
