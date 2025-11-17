import { useState, useEffect } from 'react';
import { getIpInfo } from '@/services/ip-info';
import { getCachedWeather, setCachedWeather } from '@/lib/weather-cache';

/**
 * 天气信息类型
 */
export interface WeatherInfo {
  temp: number;
  condition: string;
  icon: string;
}

/**
 * 用户位置信息类型
 */
export interface UserLocation {
  city: string;
  timezone: string;
  country: string;
}

/**
 * useWeatherLocation Hook
 * 
 * 管理天气和位置信息
 * 自动从IP获取用户位置，并获取对应的天气信息
 * 支持缓存，避免重复请求
 * 
 * @param locale - 当前语言设置
 * @returns 返回天气和位置状态
 */
export const useWeatherLocation = (locale: string) => {
  /** 天气信息 */
  const [weather, setWeather] = useState<WeatherInfo | null>({
    temp: 21,
    condition: 'Partly cloudy',
    icon: '116'
  });
  
  /** 用户位置信息 */
  const [userLocation, setUserLocation] = useState<UserLocation | null>(null);

  /**
   * 获取天气和位置数据
   */
  useEffect(() => {
    const fetchWeatherAndLocation = async () => {
      // 使用统一的天气缓存工具（已包含4小时过期机制）

      try {
        // 先尝试从缓存读取天气信息（包含过期检查）
        const cachedWeather = getCachedWeather();
        if (cachedWeather) {
          setWeather(cachedWeather);
        }

        // 根据当前语言设置API语言参数
        const langMap: Record<string, string> = {
          'zh': 'zh-CN',
          'en': 'en',
        };
        const apiLang = langMap[locale] || 'en';
        
        // 获取IP定位 (使用封装的IP信息服务，自动尝试多个接口，支持缓存)
        const locationData = await getIpInfo({
          lang: apiLang,
          timeout: 15000,
        });
        
        if (locationData) {
          const city = locationData.city || locationData.regionName || '北京';
          const timezone = locationData.timezone || 'Asia/Shanghai';
          let country = locationData.country || '中国';
          
          // 特殊地区映射到国家（根据语言）
          const regionToCountryMap: Record<string, Record<string, string>> = {
            'zh-CN': {
              '香港': '中国',
              '澳门': '中国',
              '台湾': '中国',
            },
            'en': {
              'Hong Kong': 'China',
              'Macao': 'China',
              'Taiwan': 'China',
            }
          };
          
          // 如果当前country在映射表中，则替换为对应的国家
          if (regionToCountryMap[apiLang] && regionToCountryMap[apiLang][country]) {
            country = regionToCountryMap[apiLang][country];
          }
          
          setUserLocation({ city, timezone, country });
          
          // 获取天气信息（这里使用模拟数据，实际应该调用天气API）
          // 注意：实际项目中应该调用真实的天气API
          const weatherCode = '116'; // 默认天气代码
          const temp = 21; // 默认温度
          const condition = 'Partly cloudy'; // 默认天气状况
          
          const weatherInfo: WeatherInfo = {
            temp,
            condition,
            icon: weatherCode,
          };
          
          setCachedWeather(weatherInfo);
          setWeather(weatherInfo);
        }
      } catch (error) {
        console.error('Failed to fetch weather and location:', error);
        // 使用默认值
        setWeather({
          temp: 21,
          condition: 'Partly cloudy',
          icon: '116'
        });
      }
    };

    fetchWeatherAndLocation();
  }, [locale]);

  return {
    /** 天气信息 */
    weather,
    /** 用户位置信息 */
    userLocation,
    /** 设置天气信息 */
    setWeather,
    /** 设置用户位置信息 */
    setUserLocation,
  };
};

