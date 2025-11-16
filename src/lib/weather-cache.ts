/**
 * 天气信息缓存工具
 * 提供统一的天气信息缓存管理，支持4小时过期机制
 */

import { WeatherInfo } from '@/lib/hooks/useWeatherLocation';

/** 天气信息缓存键 */
const WEATHER_CACHE_KEY = 'weather-cache';
/** 天气信息缓存过期时间：4小时（毫秒） */
const WEATHER_CACHE_EXPIRY = 4 * 60 * 60 * 1000;

/**
 * 缓存的天气信息结构（包含时间戳）
 */
interface CachedWeatherInfo {
  data: WeatherInfo;
  timestamp: number;
}

/**
 * 从sessionStorage获取缓存的天气信息
 * 如果缓存已过期（超过4小时），则返回null
 * 
 * @returns 缓存的天气信息，如果不存在或已过期则返回null
 */
export function getCachedWeather(): WeatherInfo | null {
  if (typeof window === 'undefined') return null;
  try {
    const cached = sessionStorage.getItem(WEATHER_CACHE_KEY);
    if (cached) {
      const cachedData: CachedWeatherInfo = JSON.parse(cached);
      const now = Date.now();
      
      // 检查缓存是否过期（超过4小时）
      if (now - cachedData.timestamp < WEATHER_CACHE_EXPIRY) {
        console.log('Using cached weather (valid):', cachedData.data);
        return cachedData.data;
      } else {
        // 缓存已过期，清除它
        console.log('Weather cache expired, clearing...');
        sessionStorage.removeItem(WEATHER_CACHE_KEY);
      }
    }
  } catch (error) {
    console.warn('Failed to read cached weather:', error);
    // 如果解析失败，清除可能损坏的缓存
    try {
      sessionStorage.removeItem(WEATHER_CACHE_KEY);
    } catch (e) {
      // 忽略清除错误
    }
  }
  return null;
}

/**
 * 将天气信息保存到sessionStorage
 * 同时保存时间戳，用于后续的过期检查
 * 
 * @param weatherInfo - 要缓存的天气信息
 */
export function setCachedWeather(weatherInfo: WeatherInfo): void {
  if (typeof window === 'undefined') return;
  try {
    const cachedData: CachedWeatherInfo = {
      data: weatherInfo,
      timestamp: Date.now(),
    };
    sessionStorage.setItem(WEATHER_CACHE_KEY, JSON.stringify(cachedData));
    console.log('Weather info cached to sessionStorage with timestamp');
  } catch (error) {
    console.warn('Failed to cache weather:', error);
  }
}

