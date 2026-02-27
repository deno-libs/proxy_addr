import { proxyaddr } from './mod.ts'

Deno.serve({ port: 3000 }, (req, info) => {
  const res = proxyaddr(req, ['127.0.0.1', '::1'], info)

  return new Response(res)
})
