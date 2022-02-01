export type State =
  | { state: 'FROZEN' }
  | { state: 'BROKEN'; brokenAtEpochMillis: number }
  | { state: 'MELTED' }

export interface Location {
  country: string | null
  region: string | null
  city: string | null
}

export interface GetStateResult {
  loc: Location
  states: { locKey: keyof Location; state: State }[]
}

export interface PostBreakPayload {
  locKey: keyof Location
}
