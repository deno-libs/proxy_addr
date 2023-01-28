import { Server } from 'https://deno.land/std@0.130.0/http/server.ts'

import { proxyaddr, RequestWithConnection } from './mod.ts'

const s = new Server({
  handler: (req, conn) => {
    const request = req as RequestWithConnection

    request.conn = conn

    const res = proxyaddr(request, ['127.0.0.1', '::1'])

    return new Response(res)
  },
  port: 3000
})
s.listenAndServe()
