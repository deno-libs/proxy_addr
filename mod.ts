import { forwarded, isValid, parse } from './deps.ts'
import type { IPv4, IPv6, RequestWithConnection } from './deps.ts'
export { RequestWithConnection }

type Trust = ((addr: string, i?: number) => boolean) | string[] | string

const DIGIT_REGEXP = /^[0-9]+$/
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
function alladdrs(req: RequestWithConnection, trust?: Trust) {
  // get addresses

  const addrs = forwarded(req)

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

  return compileTrust(compileRangeSubnets(trust))
}
/**
 * Compile `arr` elements into range subnets.
 */
function compileRangeSubnets(arr: string[]) {
  const rangeSubnets = new Array(arr.length)
  for (let i = 0; i < arr.length; i++) {
    rangeSubnets[i] = parseIPNotation(arr[i])
  }

  return rangeSubnets
}
/**
 * Compile range subnet array into trust function.
 *
 * @param rangeSubnets
 */
function compileTrust(rangeSubnets: (IPv4 | IPv6)[][]) {
  // Return optimized function based on length
  const len = rangeSubnets.length
  return len === 0
    ? trustNone
    : len === 1
    ? trustSingle(rangeSubnets[0])
    : trustMulti(rangeSubnets)
}
/**
 * Parse IP notation string into range subnet.
 *
 * @param {String} note
 * @private
 */
export function parseIPNotation(note: string) {
  const pos = note.lastIndexOf('/')
  const str = pos !== -1 ? note.substring(0, pos) : note

  if (!isValid(str)) throw new TypeError('invalid IP address: ' + str)

  let ip = parse(str) as IPv4 | IPv6

  if (pos === -1 && ip.kind() === 'ipv6') {
    ip = ip as IPv6

    if (ip.isIPv4MappedAddress()) ip = ip.toIPv4Address()
  }

  const max = ip.kind() === 'ipv6' ? 128 : 32

  let range: string | number | null =
    pos !== -1 ? note.substring(pos + 1, note.length) : null

  if (range === null) range = max
  else if (DIGIT_REGEXP.test(range)) range = parseInt(range, 10)
  else if (ip.kind() === 'ipv4' && isValid(range)) range = parseNetmask(range)
  else range = null

  if (range && typeof range === 'number' && (range <= 0 || range > max)) {
    throw new TypeError('invalid range on address: ' + note)
  }

  return [ip, range]
}
/**
 * Parse netmask string into CIDR range.
 *
 * @param netmask
 * @private
 */
function parseNetmask(netmask: string) {
  const ip = parse(netmask)
  return ip.kind() === 'ipv4' ? ip.prefixLengthFromSubnetMask() : null
}
/**
 * Determine address of proxied request.
 *
 * @param request
 * @param trust
 * @public
 */
export function proxyaddr(req: RequestWithConnection, trust?: Trust) {
  const addrs = alladdrs(req, trust)

  return addrs[addrs.length - 1]
}
/**
 * Static trust function to trust nothing.
 */
const trustNone = () => false
/**
 * Compile trust function for multiple subnets.
 */
function trustMulti(subnets: (IPv4 | IPv6)[][]) {
  return function trust(addr: string) {
    if (!isValid(addr)) return false
    const ip = parse(addr)
    let ipconv
    const kind = ip.kind()
    for (let i = 0; i < subnets.length; i++) {
      const subnet = subnets[i]
      const subnetip = subnet[0]
      const subnetkind = subnetip.kind()
      const subnetrange = subnet[1]
      let trusted = ip
      if (kind !== subnetkind) {
        if (subnetkind === 'ipv4' && !(ip as IPv6).isIPv4MappedAddress()) {
          continue
        }

        if (!ipconv) {
          ipconv =
            subnetkind === 'ipv4'
              ? (ip as IPv6).toIPv4Address()
              : (ip as IPv6).toIPv4MappedAddress()
        }

        trusted = ipconv
      }
      // @ts-ignore types
      if (trusted.match(subnetip, subnetrange)) return true
    }
    return false
  }
}
/**
 * Compile trust function for single subnet.
 *
 * @param subnet
 */
function trustSingle(subnet: (IPv4 | IPv6)[]) {
  const subnetip = subnet[0]
  const subnetkind = subnetip.kind()
  const subnetisipv4 = subnetkind === 'ipv4'
  const subnetrange = subnet[1]

  return function trust(addr: string) {
    if (!isValid(addr)) return false

    let ip = parse(addr)
    const kind = ip.kind()

    if (kind !== subnetkind) {
      if (subnetisipv4 && !(ip as IPv6).isIPv4MappedAddress()) {
        // Incompatible IP addresses
        return false
      }

      // Convert IP to match subnet IP kind
      ip = subnetisipv4
        ? (ip as IPv6).toIPv4Address()
        : (ip as IPv6).toIPv4MappedAddress()
    }

    // @ts-ignore types
    return ip.match(subnetip, subnetrange)
  }
}

export { alladdrs as all }
export { compile }
