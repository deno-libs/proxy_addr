import {
  describe,
  expect,
  it,
  run,
} from 'https://deno.land/x/tincan@1.0.1/mod.ts'
import { all, RequestWithConnection } from './mod.ts'
import { ConnInfo } from 'https://deno.land/std@0.185.0/http/server.ts'

const createReq = (
  hostname: string,
  headers?: Record<string, string>,
): RequestWithConnection => ({
  conn: {
    remoteAddr: {
      hostname,
      port: 8081,
      transport: 'tcp',
    },
  } as ConnInfo,
  headers: new Headers(headers || {}),
} as unknown as RequestWithConnection)

describe('all(req, trust)', () => {
  it('with no headers should return socket address', () => {
    const req = createReq('127.0.0.1')
    expect(all(req)).toEqual(['127.0.0.1'])
  })
  it('with x-forwarded-for header should include x-forwarded-for', () => {
    const req = createReq('127.0.0.1', { 'x-forwarded-for': '10.0.0.1' })

    expect(all(req)).toEqual(['127.0.0.1', '10.0.0.1'])
  })
  it('with x-forwarded-for header should include x-forwarded-for in correct order', () => {
    const req = createReq('127.0.0.1', {
      'x-forwarded-for': '10.0.0.1, 10.0.0.2',
    })
    expect(all(req)).toEqual(['127.0.0.1', '10.0.0.2', '10.0.0.1'])
  })
  it('with trust argument should stop at first untrusted', () => {
    const req = createReq('127.0.0.1', {
      'x-forwarded-for': '10.0.0.1, 10.0.0.2'
    })
    expect(all(req, '127.0.0.1')).toEqual(['127.0.0.1', '10.0.0.2'])
  })
  it('with trust argument should be only socket address for no trust', () => {
    const req = createReq('127.0.0.1', {
      'x-forwarded-for': '10.0.0.1, 10.0.0.2'
    })
    expect(all(req, [])).toEqual(['127.0.0.1'])
  })
})

run()
