# proxy_addr

[![GitHub release (latest by date)][releases]][releases-page] [![][docs-badge]][docs]

Deno port of [proxy-addr](https://github.com/jshttp/proxy-addr/blob/master/index.js) library.

## Usage

```ts
import { Server } from 'https://deno.land/std@0.107.0/http/server.ts'
import { proxyaddr, RequestWithConnection } from 'https://deno.land/x/proxy_addr/mod.ts'

const s = new Server({
  handler: (req, conn) => {
    const request = req as RequestWithConnection

    request.conn = conn

    const res = proxyaddr(request, ['localhost'])

    return new Response(res)
  }
})
```

[license]: https://github.com/deno-libs/proxy_addr/blob/master/LICENSE
[releases]: https://img.shields.io/github/v/release/deno-libs/proxy_addr?style=flat-square
[docs-badge]: https://img.shields.io/github/v/release/deno-libs/proxy_addr?color=yellow&label=docs&logo=deno&style=flat-square
[docs]: https://doc.deno.land/https/deno.land/x/proxy_addr/mod.ts
[releases-page]: https://github.com/deno-libs/proxy_addr/releases
