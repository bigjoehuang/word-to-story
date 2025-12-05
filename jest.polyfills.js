// This file must be loaded BEFORE any Next.js imports
// Polyfill for Web APIs using undici

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
    // Fallback implementations
    console.warn('undici not available, using fallback polyfills')
  }
}





