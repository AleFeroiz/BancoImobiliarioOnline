export function wrapSpaceLabel(name: string, maxWidth: number, measureText: (text: string) => number) {
  const words = name.toLocaleUpperCase('pt-BR').trim().split(/\s+/).filter(Boolean)
  const lines: string[] = []
  let currentLine = ''

  for (const word of words) {
    const candidate = currentLine ? `${currentLine} ${word}` : word
    if (currentLine && measureText(candidate) > maxWidth) {
      lines.push(currentLine)
      currentLine = word
    } else {
      currentLine = candidate
    }
  }

  if (currentLine) lines.push(currentLine)
  return lines
}
