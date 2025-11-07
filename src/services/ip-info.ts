/**
 * IP信息查询服务
 * 封装多个IP查询API接口，依次尝试，第一个成功即返回
 * API列表来源: https://github.com/ihmily/ip-info-api
 */

export interface IpInfo {
  ip?: string;
  country?: string;
  countryCode?: string;
  region?: string;
  regionName?: string;
  city?: string;
  timezone?: string;
  latitude?: number;
  longitude?: number;
  isp?: string;
  org?: string;
  as?: string;
  asn?: number;
  [key: string]: any; // 允许其他字段
}

export interface IpInfoOptions {
  /** 查询的IP地址，为空则查询本机IP */
  ip?: string;
  /** 语言设置，如 'zh-CN', 'en' */
  lang?: string;
  /** 请求超时时间（毫秒），默认5000 */
  timeout?: number;
}

/**
 * 带超时的fetch请求
 */
async function fetchWithTimeout(
  url: string,
  timeout: number = 5000
): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'Accept': 'application/json',
      },
    });
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
}

/**
 * 标准化IP信息，将不同API返回的数据格式统一
 */
function normalizeIpInfo(data: any, source: string): IpInfo | null {
  try {
    const info: IpInfo = {};

    // 根据不同API的返回格式进行标准化
    switch (source) {
      case 'ip-api.com':
      case 'demo.ip-api.com':
        if (data.status === 'success' || data.status === 'fail') {
          if (data.status === 'fail') return null;
          info.ip = data.query || data.ip;
          info.country = data.country;
          info.countryCode = data.countryCode;
          info.region = data.region;
          info.regionName = data.regionName;
          info.city = data.city;
          info.timezone = data.timezone;
          info.latitude = data.lat;
          info.longitude = data.lon;
          info.isp = data.isp;
          info.org = data.org;
          info.as = data.as;
          return info;
        }
        return null;

      case 'ipapi.co':
        info.ip = data.ip;
        info.country = data.country_name;
        info.countryCode = data.country_code;
        info.region = data.region_code;
        info.regionName = data.region;
        info.city = data.city;
        info.timezone = data.timezone;
        info.latitude = data.latitude;
        info.longitude = data.longitude;
        info.isp = data.org;
        return info;

      case 'ip-api.io':
        info.ip = data.ip;
        info.country = data.country_name;
        info.countryCode = data.country_code;
        info.region = data.region_code;
        info.regionName = data.region_name;
        info.city = data.city;
        info.timezone = data.time_zone?.name;
        info.latitude = data.latitude;
        info.longitude = data.longitude;
        info.isp = data.isp;
        return info;

      case 'ipapi.is':
        info.ip = data.ip;
        info.country = data.country;
        info.countryCode = data.country_code;
        info.region = data.region_code;
        info.regionName = data.region;
        info.city = data.city;
        info.timezone = data.timezone;
        info.latitude = data.latitude;
        info.longitude = data.longitude;
        info.isp = data.org;
        return info;

      case 'ip.sb':
        info.ip = data.ip;
        info.country = data.country;
        info.countryCode = data.country_code;
        info.region = data.region;
        info.regionName = data.region;
        info.city = data.city;
        info.timezone = data.timezone;
        info.latitude = data.latitude;
        info.longitude = data.longitude;
        info.isp = data.organization;
        info.asn = data.asn;
        return info;

      case 'ipwhois.app':
        if (data.success === false) return null;
        info.ip = data.ip;
        info.country = data.country;
        info.countryCode = data.country_code;
        info.region = data.region;
        info.regionName = data.region;
        info.city = data.city;
        info.timezone = data.timezone?.id;
        info.latitude = data.latitude;
        info.longitude = data.longitude;
        info.isp = data.isp;
        info.org = data.org;
        info.asn = data.asn;
        return info;

      case 'db-ip.com':
        info.ip = data.ipAddress;
        info.country = data.countryName;
        info.countryCode = data.countryCode;
        info.region = data.stateProvCode;
        info.regionName = data.stateProv;
        info.city = data.city;
        info.timezone = data.timeZone;
        info.latitude = data.latitude;
        info.longitude = data.longitude;
        info.isp = data.isp;
        info.org = data.organization;
        info.asn = data.asNumber;
        return info;

      case 'freeipapi.com':
        info.ip = data.ipAddress;
        info.country = data.countryName;
        info.countryCode = data.countryCode;
        info.region = data.regionName;
        info.regionName = data.regionName;
        info.city = data.cityName;
        info.timezone = data.timeZone;
        info.latitude = data.latitude;
        info.longitude = data.longitude;
        return info;

      case 'pconline.com.cn':
        if (data.code !== 0) return null;
        info.ip = data.ip;
        info.country = data.pro;
        info.region = data.proCode;
        info.regionName = data.pro;
        info.city = data.city;
        info.isp = data.addr;
        return info;

      case 'vore.top':
        info.ip = data.ip;
        info.country = data.country;
        info.countryCode = data.countryCode;
        info.region = data.region;
        info.regionName = data.region;
        info.city = data.city;
        info.timezone = data.timezone;
        info.latitude = data.latitude;
        info.longitude = data.longitude;
        info.isp = data.isp;
        return info;

      case 'realip.cc':
        info.ip = data.ip;
        info.country = data.country;
        info.countryCode = data.country_code;
        info.region = data.region;
        info.regionName = data.region;
        info.city = data.city;
        info.timezone = data.timezone;
        info.latitude = data.latitude;
        info.longitude = data.longitude;
        info.isp = data.isp;
        return info;

      default:
        // 尝试通用解析
        if (data.ip || data.query) {
          info.ip = data.ip || data.query;
          info.country = data.country || data.country_name || data.countryName;
          info.countryCode = data.countryCode || data.country_code || data.countryCode;
          info.city = data.city || data.cityName;
          info.timezone = data.timezone || data.timeZone || data.time_zone?.name;
          info.latitude = data.latitude || data.lat;
          info.longitude = data.longitude || data.lon;
          info.isp = data.isp || data.organization || data.org;
          return Object.keys(info).length > 0 ? info : null;
        }
        return null;
    }
  } catch (error) {
    console.error(`Error normalizing IP info from ${source}:`, error);
    return null;
  }
}

/**
 * IP信息查询API配置
 */
interface ApiConfig {
  name: string;
  url: (ip?: string, lang?: string) => string;
  supportsIpQuery: boolean; // 是否支持查询指定IP
}

const IP_INFO_APIS: ApiConfig[] = [
  // 支持查询指定IP的API
  {
    name: 'ip-api.com',
    url: (ip, lang) => {
      const langParam = lang ? `&lang=${lang}` : '';
      const ipParam = ip ? `&ip=${ip}` : '';
      return `http://ip-api.com/json/?fields=status,message,country,countryCode,region,regionName,city,timezone,lat,lon,isp,org,as,query${langParam}${ipParam}`;
    },
    supportsIpQuery: true,
  },
  {
    name: 'ipapi.co',
    url: (ip) => {
      const ipParam = ip ? `/${ip}` : '';
      return `https://ipapi.co${ipParam}/json/`;
    },
    supportsIpQuery: true,
  },
  {
    name: 'ip-api.io',
    url: (ip) => {
      const ipParam = ip ? `?ip=${ip}` : '';
      return `https://ip-api.io/json${ipParam}`;
    },
    supportsIpQuery: true,
  },
  {
    name: 'ipapi.is',
    url: () => 'https://api.ipapi.is',
    supportsIpQuery: false,
  },
  {
    name: 'ip.sb',
    url: (ip) => {
      const ipParam = ip ? `?ip=${ip}` : '';
      return `https://api.ip.sb/geoip/${ipParam}`;
    },
    supportsIpQuery: true,
  },
  {
    name: 'ipwhois.app',
    url: (ip) => {
      const ipParam = ip ? `?ip=${ip}` : '';
      return `https://ipwhois.app/json/${ipParam}?format=json`;
    },
    supportsIpQuery: true,
  },
  {
    name: 'db-ip.com',
    url: () => 'https://api.db-ip.com/v2/free/self',
    supportsIpQuery: false,
  },
  {
    name: 'freeipapi.com',
    url: () => 'https://freeipapi.com/api/json',
    supportsIpQuery: false,
  },
  {
    name: 'pconline.com.cn',
    url: (ip) => {
      const ipParam = ip ? `&ip=${ip}` : '';
      return `https://whois.pconline.com.cn/ipJson.jsp?json=true${ipParam}`;
    },
    supportsIpQuery: true,
  },
  {
    name: 'vore.top',
    url: (ip) => {
      const ipParam = ip ? `?ip=${ip}` : '';
      return `https://api.vore.top/api/IPdata${ipParam}`;
    },
    supportsIpQuery: true,
  },
  {
    name: 'realip.cc',
    url: () => 'https://realip.cc/',
    supportsIpQuery: false,
  },
];

const IP_INFO_CACHE_KEY = 'ip-info-cache';

/**
 * 从 sessionStorage 获取缓存的IP信息
 */
function getCachedIpInfo(): IpInfo | null {
  if (typeof window === 'undefined') {
    return null;
  }

  try {
    const cached = sessionStorage.getItem(IP_INFO_CACHE_KEY);
    if (cached) {
      return JSON.parse(cached) as IpInfo;
    }
  } catch (error) {
    console.warn('Failed to read cached IP info:', error);
  }

  return null;
}

/**
 * 将IP信息保存到 sessionStorage
 */
function setCachedIpInfo(info: IpInfo): void {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    sessionStorage.setItem(IP_INFO_CACHE_KEY, JSON.stringify(info));
  } catch (error) {
    console.warn('Failed to cache IP info:', error);
  }
}

/**
 * 获取IP信息
 * 依次尝试多个API接口，第一个成功即返回
 * 如果查询本机IP（未指定ip参数），会先从 sessionStorage 读取缓存
 * 
 * @param options 查询选项
 * @returns IP信息，如果所有接口都失败则返回null
 */
export async function getIpInfo(
  options: IpInfoOptions = {}
): Promise<IpInfo | null> {
  const { ip, lang, timeout = 5000 } = options;

  // 如果查询本机IP（未指定ip参数），先尝试从缓存读取
  if (!ip && typeof window !== 'undefined') {
    const cached = getCachedIpInfo();
    if (cached) {
      console.log('Using cached IP info:', cached);
      return cached;
    }
  }
  
  console.log('Fetching IP info from API...');

  // 如果指定了IP，只使用支持IP查询的API
  const apis = ip
    ? IP_INFO_APIS.filter((api) => api.supportsIpQuery)
    : IP_INFO_APIS;

  // 依次尝试每个API
  for (const api of apis) {
    try {
      const url = api.url(ip, lang);
      const response = await fetchWithTimeout(url, timeout);

      if (!response.ok) {
        console.warn(`API ${api.name} returned status ${response.status}`);
        continue;
      }

      const data = await response.json();
      const normalizedInfo = normalizeIpInfo(data, api.name);

      if (normalizedInfo) {
        console.log(`Successfully fetched IP info from ${api.name}:`, normalizedInfo);
        
        // 如果查询本机IP，保存到缓存
        if (!ip && typeof window !== 'undefined') {
          setCachedIpInfo(normalizedInfo);
          console.log('IP info cached to sessionStorage');
        }
        
        return normalizedInfo;
      }
    } catch (error) {
      // 静默失败，继续尝试下一个API
      console.warn(`API ${api.name} failed:`, error instanceof Error ? error.message : error);
      continue;
    }
  }

  // 所有API都失败
  console.error('All IP info APIs failed');
  return null;
}

