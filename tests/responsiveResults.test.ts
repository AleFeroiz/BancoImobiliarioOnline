import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

const styles = readFileSync(new URL('../src/ui/styles.css', import.meta.url), 'utf8')

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
