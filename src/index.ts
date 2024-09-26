import { mergeConfig } from './setting'
import {
  Logger,
  buildCacheData,
  buildCacheId,
  interfaceParameterVerification,
  parseCacheData,
  standardErrorMagMapper
} from './utils'
import type {
  ICacheData,
  IDefaultConfig,
  IDelMemCacheOptions,
  IMemCacheOptions
} from './type'

class MemCache {
  private logger: Logger
  bucket: Map<string, Map<string, ICacheData>>
  lruBucket: Map<string, string[]>
  config: IDefaultConfig

  constructor(config: IDefaultConfig) {
    this.bucket = new Map()
    this.lruBucket = new Map()
    this.config = mergeConfig(config)
    this.logger = new Logger(this.config)
  }

  /**
   * 获取缓存数据基础方法
   * @param {string} type 资源类型 ex:user 或 '/topstory/recommenduser'
   * @param {object} options 缓存选项 根据其生成缓存id
   * @param {object|string} options.cacheKey 缓存key - 字符串直接作为缓存id 对象则根据其生成缓存id
   * @returns
   */
  __getCache__(type, options: IMemCacheOptions): ICacheData {
    interfaceParameterVerification(type, options)

    const cacheMap = this.bucket.get(type)

    if (!cacheMap) return undefined

    let cacheData: ICacheData | undefined = cacheMap.get(
      buildCacheId(options.cacheKey)
    )

    if (!cacheData) return undefined

    cacheData = parseCacheData(type, cacheData, {
      ...options,
      // ??? 如果缓存过期,则使用cacheKey 移除缓存
      cacheKey: cacheData.cacheId
    })

    return cacheData
  }

  /**
   * 删除关联资源缓存
   * @param type 资源类型 ex:user 或 '/topstory/recommenduser'
   * @returns
   */
  __deleteRelatedResourceCache__(type: string, options: IDelMemCacheOptions) {
    // 明确指定不删除关联资源缓存 则直接返回
    if (options.deleteRelatedResource === false) return true

    const relResourceType: string | string[] | undefined =
      this.config.relatedResourceMapper[type]

    if (!relResourceType) return true

    // 删除关联资源缓存 例如删除 user 时删除 meta 缓存
    if (Array.isArray(relResourceType)) {
      relResourceType.forEach((type) => {
        this.delete(type)
      })
    } else {
      this.delete(relResourceType)
    }

    return true
  }

  /**
   * 按资源类型更新lru队列
   * @param {string} type 资源类型 ex:user 或 '/topstory/recommenduser'
   * @param {string} cacheId 数据 id
   */
  _updateLruQuqueByType(type, cacheId) {
    let lruQuque = this.lruBucket.get(type) || []

    if (lruQuque.length >= this.config.limt) {
      const tail = lruQuque.pop()
      this.logger.log(`"${type}" 缓存队列已满，删除尾部缓存 :`, tail)
      // 删除尾部 数据缓存
      this.bucket.get(type).delete(tail)
    }

    // 如果已经存在 则删除
    lruQuque = lruQuque.filter((cid) => cid !== cacheId)

    // 插入到头部
    lruQuque.unshift(cacheId)

    // 更新
    this.lruBucket.set(type, lruQuque)
  }

  /**
   * 按资源类型删除lru队列
   * @param type
   * @param cacheId
   * @returns
   */
  _deleteLruQuqueByType(type, cacheId = null) {
    let lruQuque = this.lruBucket.get(type)
    if (!lruQuque) return
    if (cacheId) {
      lruQuque = lruQuque.filter((cid) => cid !== cacheId)
      // 更新
      this.lruBucket.set(type, lruQuque)
    } else {
      this.lruBucket.delete(type)
    }
  }

  /**
   * 是否存在缓存
   * - 只判断是否存在缓存数据 不判断是否过期 与 缓存值是否有效
   * @param {string} type 资源类型 ex:user 或 '/topstory/recommenduser'
   * @param {object} options 缓存选项 根据其生成缓存id
   * @param {object|string} options.cacheKey 缓存key - 字符串直接作为缓存id 对象则根据其生成缓存id
   * @returns {boolean} 是否存在缓存
   *
   * ```js
   *  memCache.has('user',{cacheKey:'user.id=1'})
   *
   *  memCache.has('/topstory/recommenduser',{cacheKey:{page:1,pageSize:10}})
   * ```
   *
   */
  has(type, options) {
    const cacheMap = this.bucket.get(type)

    if (!cacheMap) return false

    const cacheData = cacheMap.get(buildCacheId(options))

    return !!cacheData
  }

  /**
   * 获取缓存数据
   * @param {string} type 资源类型 ex: 'user' 或 '/topstory/recommenduser'
   * @param {object} options 缓存选项 根据其生成缓存id
   * @param {object|string} options.cacheKey 缓存key - 字符串直接作为缓存id 对象则根据其生成缓存id
   * @returns {any|undefined} cacheValue 缓存数据
   * ```js
   *  memCache.get('user',{cacheKey:'user.id=1'})
   *
   *  memCache.get('/topstory/recommenduser',{cacheKey:{page:1,pageSize:10}})
   * ```
   */
  get(type, options: IMemCacheOptions) {
    const cacheData: ICacheData | undefined = this.__getCache__(type, options)

    // ??? 缓存无效即为 undefined
    if (cacheData === undefined) return undefined

    this.logger.log(`命中 "${type}" 缓存 :`, cacheData)

    this._updateLruQuqueByType(type, cacheId)

    return cacheData.cacheValue
  }

  /**
   * 设置缓存数据
   * @param {string} type 资源类型 ex:user 或 '/topstory/recommenduser'
   * @param {object} options 缓存选项 根据其生成缓存id
   * @param {object|string} options.cacheKey 缓存key - 字符串直接作为缓存id 对象则根据其生成缓存id
   * @param {object|boolean|string} data 缓存数据
   * @returns
   */
  set(type, options: IMemCacheOptions, data) {
    interfaceParameterVerification(type, options)

    const cacheMap = this.bucket.get(type) || new Map()
    if (!this.bucket.has(type)) {
      this.bucket.set(type, cacheMap)
    }

    const cacheId = buildCacheId(options.cacheKey)
    if (cacheMap.has(cacheId)) {
      // 禁止隐式更新 只有通过 update 方法更新才更新缓存数据
      this.logger.warn(
        `设置 "${type}" 缓存失败!
          已存在该缓存，如要更新缓存，请使用 memCache.update(type,options,data) 方法
          `,
        data
      )
      return false
    }

    const cacheData = buildCacheData(data, options, cacheId)

    this.logger.log(`设置 "${type}" 缓存 :`, cacheData)

    cacheMap.set(cacheId, cacheData)

    this._updateLruQuqueByType(type, cacheId)

    return true
  }

  /**
   * 更新缓存数据
   * @param {string} type 资源类型 ex:user 或 '/topstory/recommenduser'
   * @param {object} options 缓存选项 根据其生成缓存id
   * @param {object|string} options.cacheKey 缓存key - 字符串直接作为缓存id 对象则根据其生成缓存id
   * @param {object|boolean|string} data 缓存数据
   * @returns
   */
  update(type: string, options: IMemCacheOptions, data: any) {
    const cacheData: ICacheData | undefined = this.__getCache__(type, options)
    // ??? 缓存无效即为 undefined
    if (cacheData === undefined) {
      this.logger.error(standardErrorMagMapper[3001], type, options)
      return false
    }

    const { cacheId } = cacheData

    const newCacheData = buildCacheData(data, options, cacheId)

    this.logger.log(`更新 "${type}" 缓存 :`, newCacheData)

    this._updateLruQuqueByType(type, cacheId)

    return this.bucket.get(type).set(cacheId, newCacheData)
  }

  /**
   * 删除缓存数据
   * @param {string} type 资源类型 ex:user 或 '/topstory/recommenduser'
   * @param {object} options 缓存选项 根据其生成缓存id
   * @param {object|string} options.cacheKey 缓存key - 字符串直接作为缓存id 对象则根据其生成缓存id
   * @param {boolean} options.deleteRelatedResource  是否删除关联资源缓存
   * @returns {boolean}
   */
  delete(type: string, options: IDelMemCacheOptions) {
    if (!type || !options) {
      this.logger.warn('当前 type :', type)
      this.logger.warn('当前 options :', options)
      standardError(4001)
    }

    this.__deleteRelatedResourceCache__(type, options)

    const cacheMap = this.bucket.get(type)

    if (!cacheMap) return false

    // 删除指定缓存
    if (options.cacheKey) {
      const cacheId = buildCacheId(options.cacheKey)
      this.logger.log(`删除指定 "${type}" 资源 指定 cacheId 缓存 :`, cacheId)
      this._deleteLruQuqueByType(type, cacheId)
      return cacheMap.delete(cacheId)
    }

    this.logger.log(`删除指定 "${type}" 资源 缓存 `)
    this._deleteLruQuqueByType(type)

    return this.bucket.delete(type)
  }

  clear() {
    this.bucket.clear()
    this.lruBucket.clear()
  }
}

export { MemCache }
