import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

describe('carregamento de rótulos 3D', () => {
  it('isola a suspensão da fonte dos rótulos de propriedades do restante do Canvas', () => {
    const source = readFileSync(new URL('../src/ui/BoardScene.tsx', import.meta.url), 'utf8')
    expect(source).toMatch(/<Suspense fallback=\{null\}>\s*\{propertyRentLabels\.map\([\s\S]*?<\/Billboard>\)\}\s*<\/Suspense>/)
  })
})
