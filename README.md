# proxy_addr

[![GitHub release (latest by date)][releases]][releases-page]
[![GitHub Workflow Status][gh-actions-img]][github-actions]
[![Codecov][codecov-badge]][codecov]

Deno port of
[proxy-addr](https://github.com/jshttp/proxy-addr/blob/master/index.js) library.

## Usage

```ts
import { proxyaddr } from 'jsr:@deno-libs/proxy-addr'

Deno.serve((req, info) => {
  const res = proxyaddr(req, ['127.0.0.1'], info)

  return new Response(res)
})
```

[license]: https://github.com/deno-libs/proxy_addr/blob/master/LICENSE
[releases]: https://img.shields.io/github/v/release/deno-libs/proxy_addr?style=flat-square
[releases-page]: https://github.com/deno-libs/proxy_addr/releases
[gh-actions-img]: https://img.shields.io/github/actions/workflow/status/deno-libs/proxy_addr/main.yml?branch=master&style=flat-square
[codecov]: https://codecov.io/gh/deno-libs/proxy_addr
[github-actions]: https://github.com/deno-libs/proxy_addr/actions
[codecov-badge]: https://img.shields.io/codecov/c/gh/deno-libs/proxy_addr?style=flat-square
