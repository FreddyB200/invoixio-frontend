import '@testing-library/jest-dom/vitest'
import { afterEach, beforeEach } from 'vitest'
import { cleanup } from '@testing-library/react'

// Node >= 25 expone un localStorage experimental que tapa al de jsdom; se usa uno en memoria, igual en cualquier Node.
function memoryStorage() {
  let datos = new Map()
  return {
    getItem: (k) => (datos.has(k) ? datos.get(k) : null),
    setItem: (k, v) => { datos.set(String(k), String(v)) },
    removeItem: (k) => { datos.delete(k) },
    clear: () => { datos = new Map() },
    key: (i) => [...datos.keys()][i] ?? null,
    get length() { return datos.size },
  }
}

beforeEach(() => {
  for (const nombre of ['localStorage', 'sessionStorage']) {
    Object.defineProperty(globalThis, nombre, { value: memoryStorage(), configurable: true, writable: true })
    Object.defineProperty(window, nombre, { value: globalThis[nombre], configurable: true, writable: true })
  }
})

afterEach(() => { cleanup() })
