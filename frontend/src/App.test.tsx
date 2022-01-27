import React from 'react'
import { render, screen } from '@testing-library/react'
import App from './App'

test('タイトルある', () => {
  render(<App />)
  expect(screen.getByText(/ウェブ薄氷/i)).toBeInTheDocument()
})
