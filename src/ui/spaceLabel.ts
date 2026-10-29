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

export function fitSpaceLabel(
  name: string,
  maxWidth: number,
  measureText: (text: string, fontSize: number) => number,
  preferredFontSize = 168,
  minimumFontSize = 104,
) {
  let fontSize = preferredFontSize
  let lines = wrapSpaceLabel(name, maxWidth, (text) => measureText(text, fontSize))
  while (lines.length > 3 && fontSize > minimumFontSize) {
    fontSize = Math.max(minimumFontSize, fontSize - 12)
    lines = wrapSpaceLabel(name, maxWidth, (text) => measureText(text, fontSize))
  }
  return { fontSize, lines }
}
