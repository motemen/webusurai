import React from 'react'
import useSWR, { mutate } from 'swr'
import { State as UsuraiState, Location, GetStateResult } from '../../src/types'
import formatDistanceToNow from 'date-fns/formatDistanceToNow'
import ja from 'date-fns/locale/ja'

interface UsuraiProps {
  state: UsuraiState
  locKey: keyof Location
}

export const Usurai = ({ state, locKey }: UsuraiProps) => {
  switch (state.state) {
    case 'BROKEN':
      return (
        <p>
          氷は割れています (
          {formatDistanceToNow(state.brokenAtEpochMillis, {
            addSuffix: true,
            locale: ja,
          })}
          )
        </p>
      )
    case 'FROZEN':
      return (
        <>
          <p>凍っています</p>
          <button
            onClick={async () => {
              await fetch('/break', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({ locKey }),
              })
              await mutate('/state')
            }}
          >
            割る
          </button>
        </>
      )
    case 'MELTED':
      return <p>氷は溶けています…</p>
    default:
      return <></>
  }
}

function App() {
  const { data, error } = useSWR('/state', async (path) => {
    const resp = await fetch(path)
    return (await resp.json()) as unknown as GetStateResult
  })

  return (
    <>
      <h1>ウェブ薄氷</h1>
      <main>
        {error ? (
          <p>
            エラー: <code>{`${error}`}</code>
          </p>
        ) : data ? (
          data.states.map((state) => {
            return (
              <>
                <h2>
                  {state.locKey}: {data.loc[state.locKey]}
                </h2>
                <Usurai state={state.state} locKey={state.locKey} />
              </>
            )
          })
        ) : (
          <p>...</p>
        )}
      </main>
    </>
  )
}

export default App
