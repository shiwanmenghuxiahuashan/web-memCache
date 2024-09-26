import * as qs from 'qs'
import type { ICacheData, IMemCacheOptions } from './type'

const deepCopy = (obj: object | undefined) => {
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
const buildCacheId = (cacheKey: object | string) => {
  if (!cacheKey) return 'unknown-cacheKey'
  if (typeof cacheKey === 'string') return cacheKey
  // @ts-ignore
  return qs.stringify(cacheKey, { arrayFormat: 'comma' })
}

/**
 * 解析缓存id
 * @param {string} cacheId
 * @returns
 */
const parseCacheId = (cacheId: string) => {
  // @ts-ignore
  return qs.parse(cacheId, { arrayFormat: 'comma' })
}

/**
 * 构建缓存数据
 * @param {object|string|boolean|array|null} data
 * @param {object} options 缓存选项
 * @param {number} options.timeOut 单项缓存过期时间
 * @param {string} cacheId 缓存id
 * @returns {object} cacheData 缓存数据
 */
const buildCacheData = (
  data: any,
  options: IMemCacheOptions,
  cacheId: string
): ICacheData => {
  return {
    cacheId,
    cacheValue: deepCopy(data),
    cacheTime: Date.now(),
    // @ts-ignore
    timeOut: options ? options.timeOut : 0
  }
}

/**
 * 解析缓存数据
 * @param {string} type 资源类型 ex:user 或 '/topstory/recommenduser'
 * @param {object} cacheData
 * @param {object|string|boolean|array|null} cacheData.value - 缓存值
 * @param {number} cacheData.time - 缓存时间
 * @param {number} cacheData.timeOut - 缓存过期时间
 * @param {object} options 缓存选项
 * @param {number} options.timeOut 单项缓存过期时间
 * @returns {object|undefined} cacheData|undefined 缓存数据
 */
const parseCacheData = (
  type: string,
  cacheData: ICacheData,
  options: IMemCacheOptions
): ICacheData | undefined => {
  if (!cacheData || !options) {
    throw new Error('cacheData or options is undefined')
  }

  const { timeOut, cacheTime } = cacheData

  if (timeOut && Date.now() - cacheTime > timeOut) {
    // 如果缓存过期,则使用cacheKey 移除缓存
    return undefined
  }

  return deepCopy(cacheData)
}

const logWarn = (...args: any[]) => {
  // eslint-disable-next-line no-console
  console.warn(`[memCache] :`, ...args)
}
class Logger {
  private isConsole = true
  constructor(settings: { cacheLog?: boolean }) {
    this.isConsole = settings?.cacheLog ?? true
  }

  log(...args: any[]) {
    if (!this.isConsole) return
    // eslint-disable-next-line no-console
    console.log(`[memCache] :`, ...args)
  }

  error(...args: any[]) {
    if (!this.isConsole) return
    console.error(`[memCache] :`, ...args)
  }
  warn(...args: any[]) {
    if (!this.isConsole) return
    // eslint-disable-next-line no-console
    console.warn(`[memCache] :`, ...args)
  }
}

const standardErrorMagMapper: { [key: number]: string } = {
  // 1 get
  1001: '获取缓存失败！请传入正确参数',
  // 2 set
  // 3 update
  3001: '更新缓存失败！不存在该缓存，请使用 memCache.set(type,options,data) 设置缓存',
  // 4 delete
  4001: `删除缓存失败！请检查传入的参数是否正确!
   memCache.delete(type) 删除所有缓存 
   或
   memCache.delete(type,{cacheKey:'userid:1'}) 删除指定缓存
   或
    memCache.delete(type,{cacheKey:'userid:1',deleteRelatedResource:false}) 删除指定缓存并禁止删除关联资源缓存
   `,
  // 5 参数错误
  5000: '请检查传入的参数是否正确',
  5001: '请传入有效的 cacheKey,以便构建 cacheId'
  // 6 map 相关
}
/**
 * 接口参数验证
 * @param type
 * @param options
 */
const interfaceParameterVerification = (
  type: string,
  options: IMemCacheOptions
) => {
  if (!type || !options) {
    logWarn('当前 type :', type)
    logWarn('当前 options :', options)
    standardError(1001)
  }

  if (!options.cacheKey) {
    logWarn('当前 options :', options)
    standardError(5001)
  }
}

const standardError = (msg: string | number) => {
  if (typeof msg === 'number') {
    msg = standardErrorMagMapper[msg] || '未知错误'
  }
  throw new Error(`[memCache] : ${msg}`)
}

export {
  Logger,
  interfaceParameterVerification,
  standardErrorMagMapper,
  standardError,
  deepCopy,
  buildCacheId,
  parseCacheId,
  buildCacheData,
  parseCacheData
}
