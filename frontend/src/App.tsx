import React from 'react'
import useSWR, { KeyedMutator } from 'swr'
import { State as UsuraiState } from '../../src/types'
import formatDistanceToNow from 'date-fns/formatDistanceToNow'
import ja from 'date-fns/locale/ja'

const Usurai = ({
  state,
  mutateState,
}: {
  state: UsuraiState
  mutateState: KeyedMutator<UsuraiState>
}) => {
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
              await fetch('/break', { method: 'POST' })
              await mutateState()
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
  const { data, error, mutate } = useSWR('/state', async (path) => {
    const resp = await fetch(path)
    return (await resp.json()) as unknown as UsuraiState
  })

  return (
    <>
      <h1>ウェブ薄氷</h1>
      <main>
        <p></p>
        {error ? (
          <p>
            エラー: <code>{`${error}`}</code>
          </p>
        ) : data ? (
          <Usurai state={data} mutateState={mutate} />
        ) : (
          <p>...</p>
        )}
      </main>
    </>
  )
}

export default App
