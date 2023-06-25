// Common methods/properties for IPv4 and IPv6 classes.
export class IP {
  toString(): string;
}

export function isValid(addr: string): boolean;
export function parse(addr: string): IPv4 | IPv6;

export class IPv4 extends IP {
  constructor(octets: number[]);
  kind(): "ipv4";
  toIPv4MappedAddress(): IPv6;
}

export class IPv6 extends IP {
  constructor(parts: number[]);
  isIPv4MappedAddress(): boolean;
  kind(): "ipv6";
  toIPv4Address(): IPv4;
}
