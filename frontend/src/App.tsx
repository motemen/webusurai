import React from 'react'
import useSWR, { mutate } from 'swr'
import { State as UsuraiState } from '../../src/types'

const Usurai = ({ state }: { state: UsuraiState }) => {
  // TODO: mutate
  switch (state.state) {
    case 'BROKEN':
      return <p>氷は割れています (at: {state.brokenAtEpochMillis})</p>
    case 'FROZEN':
      return (
        <>
          <p>凍っています</p>
          <button
            onClick={async () => {
              fetch('/break', { method: 'POST' })
              mutate('/state')
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
          <Usurai state={data} />
        ) : (
          <p>...</p>
        )}
      </main>
    </>
  )
}

export default App
