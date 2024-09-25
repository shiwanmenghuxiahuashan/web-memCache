import { IMemCacheOptions } from './type'
const deepCopy = (obj) => {
  if (obj === null || typeof obj === 'undefined') return obj

  try {
    return JSON.parse(JSON.stringify(obj))
  } catch (e) {
    console.error(`[memCache] copy error:`, e)
    return obj
  }
}

/**
 * 生成缓存id
 * @param {object} options 缓存选项
 * @param {object|string} options.cacheKey 缓存key - 字符串直接作为缓存id 对象则根据其生成缓存id
 */
const buildCacheId = (options: IMemCacheOptions) => {
  if (typeof options.cacheKey === 'string') return options.cacheKey
  return qs.stringify(options.cacheKey, { arrayFormat: 'comma' })
}

export { deepCopy, buildCacheId }
