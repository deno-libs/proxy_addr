# proxy_addr

[![GitHub release (latest by date)][releases]][releases-page]
[![][docs-badge]][docs]
[![GitHub Workflow Status][gh-actions-img]][github-actions]
[![Codecov][codecov-badge]][codecov]

Deno port of
[proxy-addr](https://github.com/jshttp/proxy-addr/blob/master/index.js) library.

## Usage

```ts
import { serve } from 'https://deno.land/std@0.185.0/http/server.ts'
import {
  proxyaddr,
  RequestWithConnection,
} from 'https://deno.land/x/proxy_addr/mod.ts'

await serve((req, conn) => {
  const request = req as RequestWithConnection

  request.conn = conn

  const res = proxyaddr(request, ['127.0.0.1'])

  return new Response(res)
})
```

[license]: https://github.com/deno-libs/proxy_addr/blob/master/LICENSE
[releases]: https://img.shields.io/github/v/release/deno-libs/proxy_addr?style=flat-square
[docs-badge]: https://img.shields.io/github/v/release/deno-libs/proxy_addr?color=yellow&label=docs&logo=deno&style=flat-square
[docs]: https://doc.deno.land/https/deno.land/x/proxy_addr/mod.ts
[releases-page]: https://github.com/deno-libs/proxy_addr/releases
[gh-actions-img]: https://img.shields.io/github/actions/workflow/status/deno-libs/proxy_addr/main.yml?branch=master&style=flat-square
[codecov]: https://codecov.io/gh/deno-libs/proxy_addr
[github-actions]: https://github.com/deno-libs/proxy_addr/actions
[codecov-badge]: https://img.shields.io/codecov/c/gh/deno-libs/proxy_addr?style=flat-square
