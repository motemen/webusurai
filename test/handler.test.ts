import { getState } from '../src/handler'
import makeServiceWorkerEnv from 'service-worker-mock'
import parseISO from 'date-fns/parseISO'
import { Location } from '../src/types'

declare let global: unknown
declare function getMiniflareBindings(): { KV: KVNamespace }

let KV: KVNamespace

describe('getState', () => {
  beforeEach(() => {
    Object.assign(global, makeServiceWorkerEnv())
    jest.resetModules()
    ;({ KV } = getMiniflareBindings())
  })

  const loc: Location = {
    country: 'JP',
    region: null,
    city: null,
  }

  const locKey = 'country'

  test('MELTED at 15:00', async () => {
    const now = parseISO('2022-02-01T15:00:00+09:00')
    const state = await getState(now.getTime(), loc, locKey)
    expect(state.state).toBe('MELTED')
  })

  test('FROZEN at 06:00', async () => {
    const now = parseISO('2022-02-01T06:00:00+09:00')
    const state = await getState(now.getTime(), loc, locKey)
    expect(state.state).toBe('FROZEN')
  })

  test('FROZEN at 06:00 if broken before freezing', async () => {
    await KV.put(
      'broken_at',
      parseISO('2022-02-01 03:00:00+09:00').getTime().toString(),
    )
    const now = parseISO('2022-02-01T06:00:00+09:00')
    const state = await getState(now.getTime(), loc, locKey)
    expect(state.state).toBe('FROZEN')
  })

  test('BROKEN at 06:00 if broken after freezing', async () => {
    await KV.put(
      'broken_at',
      parseISO('2022-02-01 05:59:00+09:00').getTime().toString(), // freezeAt: 03:44
    )
    const now = parseISO('2022-02-01T06:00:00+09:00')
    const state = await getState(now.getTime(), loc, locKey)
    expect(state.state).toBe('BROKEN')
    expect(state).toHaveProperty(
      'brokenAtEpochMillis',
      parseISO('2022-02-01 05:59:00+09:00').getTime(),
    )
  })

  test('MELTED at 20:00 even if broken after freezing', async () => {
    await KV.put(
      'broken_at',
      parseISO('2022-02-01 05:59:00+09:00').getTime().toString(),
    )
    const now = parseISO('2022-02-01T20:00:00+09:00')
    const state = await getState(now.getTime(), loc, locKey)
    expect(state.state).toBe('MELTED')
  })
})
