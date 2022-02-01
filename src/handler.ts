import { State } from './types'
import { getAssetFromKV } from '@cloudflare/kv-asset-handler'
import utcToZonedTime from 'date-fns-tz/utcToZonedTime'
import startOfDay from 'date-fns/startOfDay'
import addMilliseconds from 'date-fns/addMilliseconds'
import seedrandom from 'seedrandom'

declare let KV: KVNamespace

const BROKEN_AT_KEY = 'broken_at'

const FROZEN: State = { state: 'FROZEN' }
const BROKEN = (brokenAtEpochMillis: number): State => ({
  state: 'BROKEN',
  brokenAtEpochMillis,
})
const MELTED: State = { state: 'MELTED' }

const ONE_HOUR = 1000 * 60 * 60
const ONE_DAY = ONE_HOUR * 24

const TIME_ZONE = 'Asia/Tokyo'

export async function getState(now: number): Promise<State> {
  // 0300-0600: どこかのタイミングで MELTED -> FROZEN に、そして BROKEN にすることが可能
  // 0600-1200: FROZEN, BROKEN にすることが可能
  // 1200-2700: MELTED

  const nowInJapan = utcToZonedTime(now, TIME_ZONE)

  const seed = Math.floor(nowInJapan.getTime() / ONE_DAY)
  const random = seedrandom(seed.toString())

  const hours = nowInJapan.getHours()

  const dayStart = startOfDay(nowInJapan)

  // 0300-0600 の間で freeze する
  const freezeAtHour = 3 + (6 - 3) * random.double()
  const freezeAt = addMilliseconds(dayStart, freezeAtHour * ONE_HOUR)

  console.log({ hours, freezeAtHour })

  if (0 <= hours && hours < 3) {
    return MELTED
  } else if (3 <= hours && hours < 12) {
    const brokenAtTime = await KV.get(BROKEN_AT_KEY)
    if (!brokenAtTime) {
      return FROZEN
    }

    const brokenAt = utcToZonedTime(parseInt(brokenAtTime), TIME_ZONE)
    console.log({ freezeAt, brokenAt })
    if (freezeAt <= brokenAt) {
      return BROKEN(parseInt(brokenAtTime))
    }

    return FROZEN
  } else {
    return MELTED
  }
}

async function updateStateBroken(now: number): Promise<boolean> {
  const state = await getState(now)

  console.log({
    now,
  })

  if (state.state === 'FROZEN') {
    await KV.put(BROKEN_AT_KEY, now.toString())
    return true
  }

  return false
}

export async function handleEvent(event: FetchEvent): Promise<Response> {
  const request = event.request
  const now = Date.now()
  const url = new URL(request.url)
  if (url.pathname === '/state') {
    return new Response(JSON.stringify(await getState(now)))
  } else if (url.pathname === '/break' && request.method === 'POST') {
    return new Response(JSON.stringify(await updateStateBroken(now)))
  } else {
    try {
      const page = await getAssetFromKV(event)
      return new Response(page.body, page)
    } catch (err) {
      return new Response('Not Found', {
        status: 404,
      })
    }
  }
}
