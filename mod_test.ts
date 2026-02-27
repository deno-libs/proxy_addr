import type { RequestWithConnection } from '@deno-libs/forwarded'
import { all } from './mod.ts'

const createReq = (
  hostname: string,
  headers?: Record<string, string>,
): RequestWithConnection => ({
  headers: new Headers(headers || {}),
} as unknown as RequestWithConnection)

const createRemoteAddrInfo = (hostname: string) => ({
  remoteAddr: {
    hostname,
    port: 8081,
    transport: 'tcp',
  } as Deno.NetAddr,
})

const assertArrayEquals = (actual: string[], expected: string[]) => {
  if (
    actual.length !== expected.length ||
    actual.some((value, index) => value !== expected[index])
  ) {
    throw new Error(
      `Assertion failed.\nExpected: ${JSON.stringify(expected)}\nActual: ${
        JSON.stringify(actual)
      }`,
    )
  }
}

Deno.test('all(req, trust): with no headers should return socket address', () => {
  const req = createReq('127.0.0.1')
  const info = createRemoteAddrInfo('127.0.0.1')
  assertArrayEquals(all(req, undefined, info), ['127.0.0.1'])
})

Deno.test('all(req, trust): with x-forwarded-for header should include x-forwarded-for', () => {
  const req = createReq('127.0.0.1', { 'x-forwarded-for': '10.0.0.1' })
  const info = createRemoteAddrInfo('127.0.0.1')
  assertArrayEquals(all(req, undefined, info), ['127.0.0.1', '10.0.0.1'])
})

Deno.test('all(req, trust): with x-forwarded-for header should include x-forwarded-for in correct order', () => {
  const req = createReq('127.0.0.1', {
    'x-forwarded-for': '10.0.0.1, 10.0.0.2',
  })
  const info = createRemoteAddrInfo('127.0.0.1')
  assertArrayEquals(all(req, undefined, info), [
    '127.0.0.1',
    '10.0.0.2',
    '10.0.0.1',
  ])
})

Deno.test('all(req, trust): with trust argument should stop at first untrusted', () => {
  const req = createReq('127.0.0.1', {
    'x-forwarded-for': '10.0.0.1, 10.0.0.2',
  })
  const info = createRemoteAddrInfo('127.0.0.1')
  assertArrayEquals(all(req, '127.0.0.1', info), ['127.0.0.1', '10.0.0.2'])
})

Deno.test('all(req, trust): with trust argument should be only socket address for no trust', () => {
  const req = createReq('127.0.0.1', {
    'x-forwarded-for': '10.0.0.1, 10.0.0.2',
  })
  const info = createRemoteAddrInfo('127.0.0.1')
  assertArrayEquals(all(req, [], info), ['127.0.0.1'])
})
