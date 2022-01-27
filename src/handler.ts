import utcToZonedTime from 'date-fns-tz/utcToZonedTime'
import addHours from 'date-fns/addHours'
import startOfDay from 'date-fns/startOfDay'
import { getAssetFromKV } from '@cloudflare/kv-asset-handler'
import { State } from './types'

declare let KV: KVNamespace
const BROKEN_AT_KEY = 'broken_at'

// https://lowreal.net/2019/06/20/1
// prettier-ignore
function makeRandom(s: number) {
	// Xorshift128 (init seed with Xorshift32)
	s ^= s << 13; s ^= 2 >>> 17; s ^= s << 5;
	let x = 123456789^s;
	s ^= s << 13; s ^= 2 >>> 17; s ^= s << 5;
	let y = 362436069^s;
	s ^= s << 13; s ^= 2 >>> 17; s ^= s << 5;
	let z = 521288629^s;
	s ^= s << 13; s ^= 2 >>> 17; s ^= s << 5;
	let w = 88675123^s;
	let t;
  return function(): number {
		t = x ^ (x << 11);
		x = y; y = z; z = w;
		// >>>0 means 'cast to uint32'
		w = ((w ^ (w >>> 19)) ^ (t ^ (t >>> 8)))>>>0;
		return w / 0x100000000;
  }
}

const FROZEN: State = { state: 'FROZEN' }
const BROKEN = (at: Date): State => ({
  state: 'BROKEN',
  brokenAtEpochMillis: at.getTime(),
})
const MELTED: State = { state: 'MELTED' }

const ONE_HOUR = 1000 * 60 * 60
const ONE_DAY = ONE_HOUR * 24

async function getState(now: Date): Promise<State> {
  // 0300-0600: どこかのタイミングで MELTED -> FROZEN に、そして BROKEN にすることが可能
  // 0600-1200: FROZEN, BROKEN にすることが可能
  // 1200-2700: MELTED

  const seed = Math.floor(now.getTime() / ONE_DAY)
  const random = makeRandom(seed)
  const hours = now.getHours()

  const dayStart = startOfDay(now)

  // 0300-0600 の間で freeze する
  const freezeAtHour = 3 + (6 - 3) * random()
  const freezeAt = addHours(dayStart, freezeAtHour)

  console.log({ hours, freezeAtHour })

  if (0 <= hours && hours < 3) {
    return MELTED
  } else if (3 <= hours && hours < 12) {
    const brokenAtTime = await KV.get(BROKEN_AT_KEY)
    if (!brokenAtTime) {
      return FROZEN
    }

    const brokenAt = utcToZonedTime(
      new Date(parseInt(brokenAtTime)),
      'Asia/Tokyo',
    )
    if (freezeAt <= brokenAt) {
      return BROKEN(brokenAt)
    }

    return FROZEN
  } else {
    return MELTED
  }
}

export async function handleEvent(event: FetchEvent): Promise<Response> {
  const request = event.request
  const now = utcToZonedTime(new Date(), 'Asia/Tokyo')
  const url = new URL(request.url)
  if (url.pathname === '/state') {
    return new Response(JSON.stringify(await getState(now)))
  } else if (url.pathname === '/break' && request.method === 'POST') {
    return new Response('Not Found', { status: 404 })
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
