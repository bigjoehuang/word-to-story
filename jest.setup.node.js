// Setup for Node.js environment (API tests)
// This runs before any imports

// Polyfill for Web APIs in Node.js test environment
if (typeof global.Request === 'undefined') {
  const { Request, Response, Headers } = require('undici')
  global.Request = Request
  global.Response = Response
  global.Headers = Headers
}

