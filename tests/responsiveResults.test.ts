import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

const styles = readFileSync(new URL('../src/ui/styles.css', import.meta.url), 'utf8')
const app = readFileSync(new URL('../src/ui/App.tsx', import.meta.url), 'utf8')

function readBlock(source: string, openingBrace: number) {
  let depth = 0

  for (let index = openingBrace; index < source.length; index += 1) {
    if (source[index] === '{') depth += 1
    if (source[index] === '}') depth -= 1
    if (depth === 0) return source.slice(openingBrace + 1, index)
  }

  return ''
}

describe('placar responsivo', () => {
  it('mantém o placar final abaixo da área principal do tabuleiro em telas móveis', () => {
    const mobileBlocks = [...styles.matchAll(/@media\s*\(max-width:\s*640px\)\s*\{/g)]
      .map((match) => readBlock(styles, match.index! + match[0].lastIndexOf('{')))
    const resultBlock = mobileBlocks.find((block) => block.includes('.screen-ended'))
    const mobileRule = resultBlock?.match(/\.screen-ended\s+\.final-result-card\s*\{([^}]*)\}/)

    expect(mobileRule).not.toBeNull()
    expect(mobileRule?.[1] ?? '').toMatch(/margin\s*:\s*auto\s+auto\s+12px\s*;?$/)
  })
})

describe('cartão de jogada', () => {
  it('preserva mais área do tabuleiro ao limitar o cartão em desktop', () => {
    const turnCardRule = [...styles.matchAll(/\.turn-card\s*\{([^}]*)\}/g)]
      .find((match) => match[1]?.includes('width:min(350px,calc(100vw - 36px))'))

    expect(turnCardRule).not.toBeNull()
    expect(turnCardRule?.[1] ?? '').toMatch(/padding\s*:\s*12px\s+15px/)
  })
})

describe('home regional responsiva', () => {
  it('mostra a rota das cinco regiões também em telas móveis', () => {
    const mobileBlocks = [...styles.matchAll(/@media\s*\(max-width:\s*640px\)\s*\{/g)]
      .map((match) => readBlock(styles, match.index! + match[0].lastIndexOf('{')))
    const homeBlock = mobileBlocks.find((block) => block.includes('.screen-home .home-region-route'))

    expect(styles).toMatch(/\.screen-home \.region-route-list\s*\{[^}]*grid-template-columns:\s*repeat\(5,minmax\(0,1fr\)\)/)
    expect(styles).toMatch(/\.screen-home\s*\{[^}]*max-width:\s*100vw;[^}]*overflow-x:\s*clip/)
    expect(styles).not.toMatch(/body\s*\{[^}]*min-width:\s*320px/)
    expect(homeBlock).toContain('.screen-home .home-region-route')
    expect(homeBlock).toContain('.screen-home .region-route-stop')
    expect(app).toContain('40 CASAS')
    expect(app).not.toContain('01 <i>/</i> 03')
  })
})
