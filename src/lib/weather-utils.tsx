"use client";

import { Sun, Moon, Cloud, CloudRain, CloudSnow, CloudDrizzle, Cloudy } from 'lucide-react';

/**
 * 根据天气代码获取对应的天气图标组件
 * 
 * @param code - wttr.in 天气代码
 * @param theme - 当前主题 ('dark' | 'light' | undefined)
 * @param mounted - 是否已挂载（用于避免 hydration 错误）
 * @returns 天气图标 React 组件
 */
export function getWeatherIcon(code: string, theme: string | undefined = 'dark', mounted: boolean = true) {
  // 在服务器端或未挂载时，使用默认的浅色主题颜色，避免 hydration 错误
  const iconProps = { 
    className: `w-full h-full ${!mounted || theme === undefined || theme !== 'dark' ? 'text-gray-600' : 'text-slate-400'}` 
  };
  
  // wttr.in 天气代码映射
  switch(code) {
    case '113': // Sunny/Clear
      return <Sun {...iconProps} />;
    case '116': // Partly cloudy
      return <Cloudy {...iconProps} />;
    case '119': // Cloudy
    case '122': // Overcast
      return <Cloud {...iconProps} />;
    case '143': // Mist
    case '248': // Fog
    case '260': // Freezing fog
      return <Cloud {...iconProps} />;
    case '176': // Patchy rain possible
    case '263': // Patchy light drizzle
    case '266': // Light drizzle
    case '281': // Freezing drizzle
    case '284': // Heavy freezing drizzle
      return <CloudDrizzle {...iconProps} />;
    case '179': // Patchy snow possible
    case '227': // Blowing snow
    case '323': // Patchy light snow
    case '326': // Light snow
    case '329': // Patchy moderate snow
    case '332': // Moderate snow
    case '335': // Patchy heavy snow
    case '338': // Heavy snow
    case '368': // Light snow showers
    case '371': // Moderate or heavy snow showers
      return <CloudSnow {...iconProps} />;
    case '182': // Patchy sleet possible
    case '185': // Patchy freezing drizzle possible
    case '293': // Patchy light rain
    case '296': // Light rain
    case '299': // Moderate rain at times
    case '302': // Moderate rainw
    case '305': // Heavy rain at times
    case '308': // Heavy rain
    case '311': // Light freezing rain
    case '314': // Moderate or heavy freezing rain
    case '317': // Light sleet
    case '320': // Moderate or heavy sleet
    case '350': // Ice pellets
    case '353': // Light rain shower
    case '356': // Moderate or heavy rain shower
    case '359': // Torrential rain shower
    case '362': // Light sleet showers
    case '365': // Moderate or heavy sleet showers
    case '374': // Light showers of ice pellets
    case '377': // Moderate or heavy showers of ice pellets
      return <CloudRain {...iconProps} />;
    default:
      return <Cloud {...iconProps} />;
  }
}

