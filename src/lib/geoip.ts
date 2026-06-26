export interface GeoIPData {
  ipAddress: string;
  country: string | null;
  city: string | null;
  region: string | null;
  latitude: number | null;
  longitude: number | null;
  isp: string | null;
  asn: string | null;
  organization: string | null;
}

/**
 * A mock/fallback GeoIP service.
 * In a real production environment, this would call MaxMind, IPinfo, or Cloudflare headers.
 * For demonstration purposes, it returns structured fake data for public IPs,
 * and identifies localhost/private networks correctly.
 */
export async function enrichIpAddress(ip: string | undefined | null): Promise<GeoIPData> {
  const fallback: GeoIPData = {
    ipAddress: ip || 'unknown',
    country: null,
    city: null,
    region: null,
    latitude: null,
    longitude: null,
    isp: null,
    asn: null,
    organization: null,
  };

  if (!ip) return fallback;

  if (ip === '::1' || ip === '127.0.0.1' || ip === 'localhost') {
    return {
      ...fallback,
      country: 'Localhost',
      city: 'Development Environment',
      organization: 'Local Network',
    };
  }

  // Very basic private IP check
  if (ip.startsWith('192.168.') || ip.startsWith('10.') || ip.startsWith('172.')) {
    return {
      ...fallback,
      country: 'Internal',
      city: 'Private Network',
      organization: 'Intranet',
    };
  }

  // For public IPs, we simulate an API call by deterministically hashing the IP to generate mock geolocation.
  // In a real app, replace this with a fetch to an actual provider like:
  // const response = await fetch(`https://ipapi.co/${ip}/json/`);
  try {
    // We are simulating GeoIP here to fulfill the dashboard's visual requirements safely.
    const regions = [
      { country: 'United States', city: 'Ashburn', region: 'Virginia', lat: 39.0438, lng: -77.4874, isp: 'Amazon AWS', asn: 'AS14618', org: 'Amazon.com' },
      { country: 'Germany', city: 'Frankfurt', region: 'Hesse', lat: 50.1109, lng: 8.6821, isp: 'DigitalOcean', asn: 'AS14061', org: 'DigitalOcean LLC' },
      { country: 'China', city: 'Beijing', region: 'Beijing', lat: 39.9042, lng: 116.4074, isp: 'China Telecom', asn: 'AS4134', org: 'China Telecom' },
      { country: 'Russia', city: 'Moscow', region: 'Moscow', lat: 55.7558, lng: 37.6173, isp: 'Rostelecom', asn: 'AS12389', org: 'Rostelecom' },
      { country: 'Brazil', city: 'São Paulo', region: 'São Paulo', lat: -23.5505, lng: -46.6333, isp: 'Claro', asn: 'AS28573', org: 'Claro S.A.' },
    ];

    const hash = ip.split('.').reduce((acc, octet) => acc + parseInt(octet || '0'), 0);
    const mockRegion = regions[hash % regions.length];

    return {
      ipAddress: ip,
      country: mockRegion.country,
      city: mockRegion.city,
      region: mockRegion.region,
      latitude: mockRegion.lat,
      longitude: mockRegion.lng,
      isp: mockRegion.isp,
      asn: mockRegion.asn,
      organization: mockRegion.org,
    };
  } catch (error) {
    console.error('GeoIP enrichment failed:', error);
    return fallback;
  }
}
