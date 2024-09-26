type CacheKey = string | Record<string, any>

/**
 * memCache 默认配置
 */
interface IDefaultConfig {
  /**
   * 按资源缓存最大限制
   * - 默认 10
   */
  limit?: number
  /**
   * 缓存过期时间
   * - 默认无过期时间 即 0
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

export { IDefaultConfig, IMemCacheOptions, IDelMemCacheOptions, ICacheData }
