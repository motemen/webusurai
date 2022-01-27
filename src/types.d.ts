export type State =
  | { state: 'FROZEN' }
  | { state: 'BROKEN'; brokenAtEpochMillis: number }
  | { state: 'MELTED' }
