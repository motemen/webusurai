import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { Usurai } from './App'
import { State } from '../../src/types'

declare let global: any

describe('Usurai', () => {
  it('FROZEN', async () => {
    const state: State = {
      state: 'FROZEN',
    }
    const onBreak = jest.fn()
    render(<Usurai state={state} locKey={'country'} onBreak={onBreak} />)
    expect(screen.getByText(/凍っています/)).toBeInTheDocument()
    const button = screen.getByText(/割る/)
    expect(button).toBeInTheDocument()

    fireEvent.click(button)
    expect(onBreak).toHaveBeenCalled()
  })

  it('MELTED', () => {
    const state: State = {
      state: 'MELTED',
    }
    render(<Usurai state={state} locKey={'country'} onBreak={() => {}} />)
    expect(screen.getByText(/氷は溶けています…/)).toBeInTheDocument()
  })

  it('BROKEN', () => {
    const state: State = {
      state: 'BROKEN',
      brokenAtEpochMillis: Date.UTC(2022, 1, 1, 0, 0, 0),
    }
    Date.now = jest.fn(() => {
      return Date.UTC(2022, 1, 1, 2, 0, 0)
    })
    render(<Usurai state={state} locKey={'country'} onBreak={() => {}} />)
    expect(screen.getByText(/氷は割れています/)).toBeInTheDocument()
    expect(screen.getByText(/約2時間前/)).toBeInTheDocument()
  })
})
