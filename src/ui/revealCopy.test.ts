import { describe, expect, it } from 'vitest'
import { getRevealKicker } from './revealCopy.js'

describe('títulos das revelações', () => {
  it('usa os nomes vigentes das casas especiais', () => {
    expect(getRevealKicker('world-cup')).toBe('COPA DO MUNDO')
    expect(getRevealKicker('world-tour')).toBe('VOLTA AO BRASIL')
  })

  it('mantém a identificação do baralho de eventos', () => {
    expect(getRevealKicker('event')).toBe('SORTE OU REVÉS')
  })
})
