import qs from 'qs'
import { CacheMap,IDefaultConfig,IMemCacheOptions } from './type'
import { mergeConfig } from './setting'
import { deepCopy ,buildCacheId} from './utils'
import { Logger } from './logger'

class MemCache {
  constructor(config: IDefaultConfig) {
    this.bucket:CacheMap = new Map()
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
  __getCache__(type, options) {

    const cacheMap = this.bucket.get(type)

    if (!cacheMap) {
      return {
        cacheData: null,
        cacheId: null
      }
    }

    const cacheId = buildCacheId(options)

    return {
      cacheId,
      cacheData: cacheMap.get(cacheId)
    }
  }


  /**
   * 解析缓存id
   * @param {string} cacheId
   * @returns
   */

  parseCacheId(cacheId) {
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
  buildCacheData(data, options = {}, cacheId) {
    /**
     * @type {object} cacheData - 缓存数据
     * - time 缓存时间
     * - timeOut 缓存过期时间
     * - value 缓存值
     */
    const cacheData = {
      cacheId,
      cacheValue: this.deepCopy(data),
      time: Date.now(),
      timeOut: options.timeOut || this.config.timeOut
    }

    return cacheData
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
   * @returns {object} cacheData
   */
  parseCacheData(type, cacheData, options = {}) {
    if (!cacheData) return undefined
    // 如果有单项缓存过期时间,则单项缓存时间优先级高于全局缓存时间
    const timeOut = options.timeOut || this.config.timeOut

    if (timeOut && Date.now() - cacheData.time > timeOut) {
      this.delete(type, options)
      return undefined
    }

    return {
      ...cacheData,
      cacheValue: this.deepCopy(cacheData.cacheValue)
    }
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
   * 是否存在缓存
   * - 只判断是否存在缓存数据 不判断是否过期 与 缓存值是否有效
   * @param {string} type 资源类型 ex:user 或 '/topstory/recommenduser'
   * @param {object} options 缓存选项 根据其生成缓存id
   * @param {object|string} options.cacheKey 缓存key - 字符串直接作为缓存id 对象则根据其生成缓存id
   * @returns {boolean} 是否存在缓存
   * @example
   *
   * ```js
   *  memCache.has('user',{cacheKey:'user.id=1'})
   * ```
   *
   */
  has(type, options) {
    const cacheMap = this.bucket.get(type)

    if (!cacheMap) return false

    const cacheId = this.buildCacheId(options)
    const cacheData = cacheMap.get(cacheId)
    return !!cacheData
  }

  /**
   * 获取缓存数据
   * @param {string} type 资源类型 ex:user 或 '/topstory/recommenduser'
   * @param {object} options 缓存选项 根据其生成缓存id
   * @param {object|string} options.cacheKey 缓存key - 字符串直接作为缓存id 对象则根据其生成缓存id
   * @returns
   */
  get(type, options) {
    // 获取缓存数据
    let { cacheData, cacheId } = this.__getCache__(type, options)

    cacheData = this.parseCacheData(type, cacheData, {
      ...options,
      cacheKey: cacheId
    })

    // ??? 缓存无效即为 undefined
    if (cacheData === undefined) return undefined

    // ?? cacheData 可能为 boolean 类型, 为 false 时也也应返回缓存值 特此判断
    if (cacheData.cacheValue === undefined) return undefined

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
  set(type, options, data) {
    let cacheMap = this.bucket.get(type)
    // 如果没有缓存 则创建一个
    if (!cacheMap) {
      this.bucket.set(type, (cacheMap = new Map()))
    }

    const cacheId = this.buildCacheId(options)

    // 不存在才设置缓存数据，防止隐式更新 只有通过 update 方法更新才更新缓存数据
    if (cacheMap.has(cacheId)) {
      this.logger.warn(
        `设置 "${type}" 缓存失败!
        已存在该缓存，如要更新缓存，请使用 memCache.update(type,options,data) 方法
        `,
        data
      )
      return true
    }

    const cacheData = this.buildCacheData(data, options, cacheId)

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
  update(type, options, data) {
    const cacheMap = this.bucket.get(type)

    if (!cacheMap) return false

    const cacheId = this.buildCacheId(options)

    let cacheData = cacheMap.get(cacheId)

    if (!cacheData) {
      this.logger.error(
        ` 更新 ${type} 缓存失败! 不存在该缓存，请使用 memCache.set(type,options,data) :`,
        cacheData
      )
      return false
    }

    cacheData = this.buildCacheData(data, options, cacheId)

    this.logger.log(`更新 "${type}" 缓存 :`, cacheData)

    this._updateLruQuqueByType(type, cacheId)

    return cacheMap.set(cacheId, cacheData)
  }
  /**
   * 删除缓存数据
   * @param {string} type 资源类型 ex:user 或 '/topstory/recommenduser'
   * @param {object} options 缓存选项 根据其生成缓存id
   * @param {object|string} options.cacheKey 缓存key - 字符串直接作为缓存id 对象则根据其生成缓存id
   * @param {boolean} options.deleteRelatedResource  是否删除关联资源缓存
   * @returns {boolean}
   */
  delete(type, options:IMemCacheOptions = { deleteRelatedResource: true }) {
    if (!type) return true

    const cacheMap = this.bucket.get(type)

    if (options.deleteRelatedResource) {
      // 删除关联资源缓存 例如删除 user 时删除 meta 缓存
      this.delete(this.config.relatedResourceMapper[type])
    }

    if (!cacheMap) return false

    // 删除指定缓存
    if (options.cacheKey) {
      const cacheId = this.buildCacheId(options)
      this.logger.log(`删除指定 "${type}" 资源 指定 cacheId 缓存 :`, cacheId)
      return cacheMap.delete(cacheId)
    }

    this.logger.log(`删除指定 "${type}" 资源 缓存 `)

    return this.bucket.delete(type)
  }

  clear() {
    this.bucket.clear()
    this.lruBucket.clear()
  }
}

export { MemCache }
