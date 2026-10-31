import { REGION_DETAILS } from '../../shared/board'

export const HOME_REGION_ROUTE = Object.entries(REGION_DETAILS).map(([id, region]) => ({
  id,
  ...region,
}))
