import { readdirSync } from 'node:fs'
import { expect, it } from 'vitest'
import { EVENT_CARDS } from '../shared/cards'

it('ships one illustration for each event card', () => {
  const directory = new URL('../public/assets/event-cards/', import.meta.url)
  const illustrations = readdirSync(directory).filter((file) => file.endsWith('.webp'))

  expect(illustrations.sort()).toEqual(EVENT_CARDS.map(({ id }) => `${id}.webp`).sort())
})
