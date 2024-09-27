type CacheKey = string | Record<string, any>

/**
 * memCache 默认配置
 */
interface IDefaultConfig {
  /**
   * 按资源缓存最大限制
   * - 默认 10
   * - 当缓存数据超过限制时，会按lru算法 删除掉最少使用缓存数据
   * - 以 资源类型 'user' 为例，当缓存数据超过 10 条时，会按lru算法 删除掉最少使用缓存数据
   * - lru 算法在 get,set,update 操作时会更新缓存数据 使用次数 以保证最新使用的数据不会被删除
   */
  limit?: number
  /**
   *  缓存过期时间戳
   * - 默认无过期时间 即 0
   * - 当缓存数据存在过期时间时，会在缓存数据过期后删除缓存数据
   */
  timeOut?: number
  /**
   * 是否打印缓存日志
   * - 默认打印
   */
  cacheLog?: boolean
  /**
   * 关联资源映射
   * - ex: { user: 'meta' }
   * - 当key资源发生非GET请求时，删除关联资源的缓存
   * - 主要用以处理隐式联动的数据关系
   * - 例如：当 card 数据存在已读状态 read 时，read 状态更新，触发 post ,删除 card
   * 防止 命中缓存，再次触发 read 状态更新，服务器返回 409 重复创建
   */
  relatedResourceMapper?: Record<string, string | string[]>
}

interface IMemCacheOptions {
  /**
   * 缓存过期时间
   * - 默认无过期时间 即 0
   * - 只对当前资源缓存有效
   */
  timeOut?: number

  /**
   * 缓存key
   * - 字符串直接作为缓存id
   * - 对象则根据其生成缓存id
   */
  cacheKey: CacheKey
}

interface IDelMemCacheOptions {
  /**
   * 缓存key
   * - 字符串直接作为缓存id
   * - 对象则根据其生成缓存id
   */
  cacheKey?: CacheKey
  /**
   * 是否删除关联资源缓存
   * - 默认删除
   * - 例如删除 user 时删除 meta 缓存
   */
  deleteRelatedResource?: boolean
}

interface ICacheData {
  /**
   * 缓存 id
   */
  cacheId: string
  /**
   * 缓存创建/更新 时间
   */
  cacheTime: number
  /**
   * 缓存过期时间
   */
  timeOut: number
  /**
   * 缓存数据
   */
  cacheValue: any
}

export {
  CacheKey,
  IDefaultConfig,
  IMemCacheOptions,
  IDelMemCacheOptions,
  ICacheData
}
