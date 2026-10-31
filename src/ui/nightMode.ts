export const NIGHT_MODE_STORAGE_KEY = 'bantec-night-mode'
export const GAME_BACKGROUND_LIGHT = '#9bbcc1'
export const GAME_BACKGROUND_NIGHT = '#142326'

export function getGameBackgroundColor(nightMode: boolean) {
  return nightMode ? GAME_BACKGROUND_NIGHT : GAME_BACKGROUND_LIGHT
}

type NightModeStorage = Pick<Storage, 'getItem' | 'setItem'>

export function readNightMode(storage: Pick<NightModeStorage, 'getItem'> | null) {
  try {
    return storage?.getItem(NIGHT_MODE_STORAGE_KEY) === 'enabled'
  } catch {
    return false
  }
}

export function saveNightMode(storage: Pick<NightModeStorage, 'setItem'> | null, enabled: boolean) {
  try {
    storage?.setItem(NIGHT_MODE_STORAGE_KEY, enabled ? 'enabled' : 'disabled')
  } catch {
    // A preferência continua ativa nesta sessão mesmo se o navegador bloquear o armazenamento local.
  }
}
