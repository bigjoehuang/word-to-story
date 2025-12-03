// Learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom'

// Polyfill for Web APIs in test environment using undici
// This must be done before any Next.js imports
if (typeof global.Request === 'undefined' || typeof global.Response === 'undefined') {
  try {
    const { Request, Response, Headers } = require('undici')
    if (typeof global.Request === 'undefined') {
      global.Request = Request
    }
    if (typeof global.Response === 'undefined') {
      global.Response = Response
    }
    if (typeof global.Headers === 'undefined') {
      global.Headers = Headers
    }
  } catch (e) {
    // Fallback if undici is not available
    if (typeof global.Request === 'undefined') {
      global.Request = class Request {
        constructor(input, init = {}) {
          this.url = typeof input === 'string' ? input : input.url
          this.method = init.method || 'GET'
          this.headers = new Headers(init.headers || {})
          this.body = init.body
        }
      }
    }
    if (typeof global.Response === 'undefined') {
      global.Response = class Response {
        constructor(body, init = {}) {
          this.body = body
          this.status = init.status || 200
          this.statusText = init.statusText || 'OK'
          this.headers = new Headers(init.headers || {})
        }
        json() {
          return Promise.resolve(JSON.parse(this.body || '{}'))
        }
        text() {
          return Promise.resolve(this.body || '')
        }
      }
    }
    if (typeof global.Headers === 'undefined') {
      global.Headers = class Headers {
        constructor(init = {}) {
          this._headers = {}
          if (init) {
            Object.entries(init).forEach(([key, value]) => {
              this._headers[key.toLowerCase()] = value
            })
          }
        }
        get(name) {
          return this._headers[name.toLowerCase()] || null
        }
        set(name, value) {
          this._headers[name.toLowerCase()] = value
        }
      }
    }
  }
}

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter() {
    return {
      push: jest.fn(),
      replace: jest.fn(),
      prefetch: jest.fn(),
      back: jest.fn(),
      pathname: '/',
      query: {},
      asPath: '/',
    }
  },
  usePathname() {
    return '/'
  },
  useSearchParams() {
    return new URLSearchParams()
  },
}))

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(), // deprecated
    removeListener: jest.fn(), // deprecated
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
})

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
}
global.localStorage = localStorageMock

// Mock sessionStorage
const sessionStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
}
global.sessionStorage = sessionStorageMock

// Suppress console errors in tests (optional)
// global.console = {
//   ...console,
//   error: jest.fn(),
//   warn: jest.fn(),
// }

