import React, { useEffect, useRef, useState } from 'react'
import useSWR, { mutate } from 'swr'
import { State as UsuraiState, Location, GetStateResult } from '../../src/types'
import formatDistanceToNow from 'date-fns/formatDistanceToNow'
import ja from 'date-fns/locale/ja'

interface UsuraiProps {
  state: UsuraiState
  locKey: keyof Location
  onBreak: () => void
  justBroken?: boolean
}

declare let twttr: any

export const Usurai = ({ state, locKey, onBreak, justBroken }: UsuraiProps) => {
  const tweetButton = useRef(null)

  useEffect(() => {
    if (tweetButton.current) {
      twttr.widgets.load(tweetButton.current)
    }
  })

  switch (state.state) {
    case 'BROKEN':
      return (
        <>
          <p>
            氷は割れています (
            {formatDistanceToNow(state.brokenAtEpochMillis, {
              addSuffix: true,
              locale: ja,
            })}
            )
          </p>
          {justBroken && (
            <p>
              <a
                ref={tweetButton}
                href="https://twitter.com/share?ref_src=twsrc%5Etfw"
                className="twitter-share-button"
                data-text="氷を割りました"
                data-lang="ja"
                data-show-count="false"
                data-size="large"
              >
                ツイート
              </a>
            </p>
          )}
        </>
      )
    case 'FROZEN':
      return (
        <>
          <p>凍っています</p>
          <button onClick={onBreak}>割る</button>
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

  const [justBroken, setJustBroken] = useState<
    Partial<Record<keyof Location, boolean>>
  >({})

  const onBreak = async (locKey: keyof Location) => {
    setJustBroken((justBroken) => ({ ...justBroken, [locKey]: true }))
    await fetch('/break', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ locKey }),
    })
    await mutate('/state')
  }

  return (
    <>
      <main>
        {error ? (
          <p>
            エラー: <code>{`${error}`}</code>
          </p>
        ) : data ? (
          data.states.map((state) => {
            return (
              <React.Fragment key={state.locKey}>
                <h2>
                  {state.locKey}: {data.loc[state.locKey]}
                </h2>
                <Usurai
                  state={state.state}
                  locKey={state.locKey}
                  onBreak={() => onBreak(state.locKey)}
                  justBroken={justBroken[state.locKey]}
                />
              </React.Fragment>
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
