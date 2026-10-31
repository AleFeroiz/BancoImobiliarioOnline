export type EventCardEffect =
  | { kind: 'generous' }
  | { kind: 'birthday'; amount: number }
  | { kind: 'blackout' }
  | { kind: 'earthquake' }
  | { kind: 'thief'; amount: number }
  | { kind: 'protection' }
  | { kind: 'jail' }
  | { kind: 'world-tour' }
  | { kind: 'world-cup' }
  | { kind: 'swap' }
  | { kind: 'world-cup-city' }
  | { kind: 'start' }

export type EventCard = {
  id: string
  title: string
  description: string
  effect: EventCardEffect
}

export const EVENT_CARDS: readonly EventCard[] = [
  { id: 'generous', title: 'Generoso', description: 'Escolha uma propriedade sua e dê a outro jogador.', effect: { kind: 'generous' } },
  { id: 'birthday', title: 'Aniversário', description: 'Receba R$ 50.000 de cada outro jogador.', effect: { kind: 'birthday', amount: 50_000 } },
  { id: 'blackout', title: 'Apagão', description: 'Escolha uma propriedade de outro jogador. Ela não cobrará aluguel pelos próximos três turnos do dono. Hotéis não podem ser escolhidos.', effect: { kind: 'blackout' } },
  { id: 'earthquake', title: 'Terremoto', description: 'Escolha uma propriedade de outro jogador e destrua-a. Ela volta ao banco. Hotéis não podem ser escolhidos.', effect: { kind: 'earthquake' } },
  { id: 'thief', title: 'Ladrão', description: 'Escolha um jogador e roube R$ 200.000 dele.', effect: { kind: 'thief', amount: 200_000 } },
  { id: 'protection', title: 'Proteção', description: 'Escolha uma propriedade sua. Por três turnos do dono, cartas não podem afetá-la.', effect: { kind: 'protection' } },
  { id: 'jail', title: 'Vá para a prisão', description: 'Vá para a prisão e resolva o canto normalmente.', effect: { kind: 'jail' } },
  { id: 'world-tour', title: 'Volta ao Brasil', description: 'Vá para Volta ao Brasil, receba R$ 200.000 e escolha seu destino.', effect: { kind: 'world-tour' } },
  { id: 'world-cup', title: 'Sede da Copa do Mundo', description: 'Vá para a sede da Copa do Mundo e resolva o canto normalmente.', effect: { kind: 'world-cup' } },
  { id: 'swap', title: 'Troca-troca', description: 'Escolha dois jogadores. Eles trocam de lugar sem resolver as casas de chegada.', effect: { kind: 'swap' } },
  { id: 'world-cup-city', title: 'Cidade-sede', description: 'Vá para a cidade que está sediando a Copa do Mundo e resolva a casa normalmente.', effect: { kind: 'world-cup-city' } },
  { id: 'start', title: 'Vá para o início', description: 'Vá para a Partida e receba R$ 200.000.', effect: { kind: 'start' } },
]
