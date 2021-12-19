import { Server } from 'https://deno.land/std@0.118.0/http/server.ts'

import { proxyaddr, RequestWithConnection } from './mod.ts'

const s = new Server({
  handler: (req, conn) => {
    const request = req as RequestWithConnection

    request.conn = conn

    const res = proxyaddr(request, ['localhost'])

    return new Response(res)
  }
})
