import { handleEvent } from '../src/handler'
import makeServiceWorkerEnv from 'service-worker-mock'

declare let global: unknown

describe('handle', () => {
  beforeEach(() => {
    Object.assign(global, makeServiceWorkerEnv())
    jest.resetModules()
  })

  test('handle GET', async () => {
    const ev = {
      request: new Request('/state', { method: 'GET' }),
    }
    const result = await handleEvent(ev as unknown as FetchEvent)
    expect(result.status).toEqual(200)
    expect(async () => {
      await result.json()
    }).not.toThrow()
  })
})
