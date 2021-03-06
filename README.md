# proxy_addr

[![GitHub release (latest by date)][releases]][releases-page] [![][docs-badge]][docs]

Deno port of [proxy-addr](https://github.com/jshttp/proxy-addr/blob/master/index.js) library.

## Usage

```ts
import { serve } from 'https://deno.land/std@0.88.0/http/server.ts'
import { proxyaddr } from 'https://deno.land/x/proxy_addr/mod.ts'

const s = await serve({ port: 3000 })

for await (const req of s) {
  console.log(proxyaddr(s))
}
```

[license]: https://github.com/deno-libs/proxy_addr/blob/master/LICENSE
[releases]: https://img.shields.io/github/v/release/deno-libs/proxy_addr?style=flat-square
[docs-badge]: https://img.shields.io/github/v/release/deno-libs/proxy_addr?color=yellow&label=Documentation&logo=deno&style=flat-square
[docs]: https://doc.deno.land/https/deno.land/x/proxy_addr/mod.ts
[releases-page]: https://github.com/deno-libs/proxy_addr/releases
