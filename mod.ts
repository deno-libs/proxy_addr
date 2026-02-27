import { forwarded } from '@deno-libs/forwarded'
import type {
  ConnectionInfo,
  RequestWithConnection,
} from '@deno-libs/forwarded'
import {
  isIPv4,
  isIPv6,
  matchIPv4Subnet,
  matchIPv6Subnet,
} from '@std/net/unstable-ip'
export type { ConnectionInfo, RequestWithConnection }

type Trust = ((addr: string, i?: number) => boolean) | string[] | string

const DIGIT_REGEXP = /^[0-9]+$/
const IPV4_MAPPED_RE = /^::ffff:(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})$/i
/**
 * Pre-defined IP ranges.
 */
const IP_RANGES: Record<string, string[]> = {
  linklocal: ['169.254.0.0/16', 'fe80::/10'],
  loopback: ['127.0.0.1/8', '::1/128'],
  uniquelocal: ['10.0.0.0/8', '172.16.0.0/12', '192.168.0.0/16', 'fc00::/7'],
}
/**
 * Get all addresses in the request, optionally stopping
 * at the first untrusted.
 *
 * @param request
 * @param trust
 */
function alladdrs(
  req: RequestWithConnection,
  trust?: Trust,
  info?: ConnectionInfo,
) {
  // get addresses

  const addrs = forwarded(req, info)

  if (!trust) return addrs

  if (typeof trust !== 'function') trust = compile(trust)

  for (let i = 0; i < addrs.length - 1; i++) {
    if (trust(addrs[i], i)) continue
    addrs.length = i + 1
  }
  return addrs
}
/**
 * Compile argument into trust function.
 *
 * @param  val
 */
function compile(val: string | string[]) {
  let trust
  if (typeof val === 'string') trust = [val]
  else if (Array.isArray(val)) trust = val.slice()
  else throw new TypeError('unsupported trust argument')

  for (let i = 0; i < trust.length; i++) {
    val = trust[i]

    if (!Object.prototype.hasOwnProperty.call(IP_RANGES, val)) {
      continue
    }

    // Splice in pre-defined range
    val = IP_RANGES[val]
    trust.splice.apply(trust, [i, 1, ...val])
    i += val.length - 1
  }

  return compileTrust(normalizeSubnets(trust))
}
/**
 * Normalize subnet strings to CIDR notation.
 */
function normalizeSubnets(arr: string[]) {
  const result = new Array<string>(arr.length)
  for (let i = 0; i < arr.length; i++) {
    result[i] = normalizeCIDR(arr[i])
  }
  return result
}
/**
 * Normalize an IP/CIDR/netmask string to CIDR notation.
 *
 * @param note IP notation (e.g. "127.0.0.1", "10.0.0.0/8", "192.168.0.0/255.255.0.0")
 */
export function normalizeCIDR(note: string) {
  const pos = note.lastIndexOf('/')
  const str = pos !== -1 ? note.substring(0, pos) : note

  if (!isIPv4(str) && !isIPv6(str)) {
    throw new TypeError('invalid IP address: ' + str)
  }

  if (pos === -1) {
    // No prefix/mask, use max prefix for exact match
    return isIPv4(str) ? str + '/32' : str + '/128'
  }

  const suffix = note.substring(pos + 1)

  if (DIGIT_REGEXP.test(suffix)) {
    // Already CIDR notation
    const range = parseInt(suffix, 10)
    const max = isIPv4(str) ? 32 : 128
    if (range <= 0 || range > max) {
      throw new TypeError('invalid range on address: ' + note)
    }
    return note
  }

  if (isIPv4(str) && isIPv4(suffix)) {
    // Netmask notation, convert to CIDR
    const prefix = netmaskToPrefixLength(suffix)
    if (prefix === null) {
      throw new TypeError('invalid range on address: ' + note)
    }
    return str + '/' + prefix
  }

  throw new TypeError('invalid range on address: ' + note)
}
/**
 * Convert a netmask string to CIDR prefix length.
 *
 * @param netmask
 */
function netmaskToPrefixLength(netmask: string): number | null {
  const parts = netmask.split('.')
  if (parts.length !== 4) return null

  let prefix = 0
  let seenZero = false

  for (const part of parts) {
    const byte = parseInt(part, 10)
    if (isNaN(byte) || byte < 0 || byte > 255) return null

    for (let bit = 7; bit >= 0; bit--) {
      if ((byte >> bit) & 1) {
        if (seenZero) return null // non-contiguous mask
        prefix++
      } else {
        seenZero = true
      }
    }
  }

  return prefix
}
/**
 * Check if an address matches a subnet, handling IPv4-mapped IPv6.
 */
function matchSubnet(addr: string, subnet: string): boolean {
  const subnetIP = subnet.substring(0, subnet.lastIndexOf('/'))
  const isSubnetV4 = isIPv4(subnetIP)
  const isAddrV4 = isIPv4(addr)

  if (isAddrV4 && isSubnetV4) {
    return matchIPv4Subnet(addr, subnet)
  }

  if (!isAddrV4 && !isSubnetV4) {
    return matchIPv6Subnet(addr, subnet)
  }

  // Handle IPv4-mapped IPv6 addresses (e.g. ::ffff:127.0.0.1)
  if (!isAddrV4 && isSubnetV4) {
    const mapped = IPV4_MAPPED_RE.exec(addr)
    if (mapped) return matchIPv4Subnet(mapped[1], subnet)
  }

  if (isAddrV4 && !isSubnetV4) {
    return matchIPv6Subnet('::ffff:' + addr, subnet)
  }

  return false
}
/**
 * Compile subnet array into trust function.
 *
 * @param subnets
 */
function compileTrust(subnets: string[]) {
  // Return optimized function based on length
  const len = subnets.length
  return len === 0
    ? trustNone
    : len === 1
    ? trustSingle(subnets[0])
    : trustMulti(subnets)
}
/**
 * Determine address of proxied request.
 *
 * @param request
 * @param trust
 * @public
 */
export function proxyaddr(
  req: RequestWithConnection,
  trust?: Trust,
  info?: ConnectionInfo,
) {
  const addrs = alladdrs(req, trust, info)

  return addrs[addrs.length - 1]
}
/**
 * Static trust function to trust nothing.
 */
const trustNone = () => false
/**
 * Compile trust function for multiple subnets.
 */
function trustMulti(subnets: string[]) {
  return function trust(addr: string) {
    if (!isIPv4(addr) && !isIPv6(addr)) return false
    for (let i = 0; i < subnets.length; i++) {
      if (matchSubnet(addr, subnets[i])) return true
    }
    return false
  }
}
/**
 * Compile trust function for single subnet.
 *
 * @param subnet
 */
function trustSingle(subnet: string) {
  return function trust(addr: string) {
    if (!isIPv4(addr) && !isIPv6(addr)) return false
    return matchSubnet(addr, subnet)
  }
}

export { alladdrs as all }
export { compile }
