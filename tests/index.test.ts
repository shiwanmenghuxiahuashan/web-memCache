import * as qs from 'qs'
import { MemCache } from '../src/index'
import { defaultConfig } from '../src/setting'

import { buildCacheId } from '../src/utils'

import type {
  CacheKey,
  ICacheData,
  IDefaultConfig,
  IMemCacheOptions
} from '../src/type'

describe('MemCache', () => {
  let memCache: MemCache
  let config: IDefaultConfig
  let cacheKey: CacheKey
  beforeEach(() => {
    config = { ...defaultConfig }
    cacheKey = {
      url: '/user',
      method: 'GET',
      page: { offset: 0, limit: 10 },
      filter: {
        account: {
          op: 'neq',
          value: 'admin'
        }
      }
    }
    memCache = new MemCache(config)
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  test('字符串 cacheKey 构建 cacheId ', () => {
    const cacheKey = 'user.id=1'
    const result = buildCacheId(cacheKey)
    expect(result).toBe(cacheKey)
  })

  test('对象 cacheKey 构建 cacheId', () => {
    const result = buildCacheId(cacheKey)

    // @ts-ignore
    const cacheId = qs.stringify(cacheKey, { arrayFormat: 'comma' })

    expect(result).toBe(cacheId)
  })

  test('初始化', () => {
    expect(memCache.bucket).toBeInstanceOf(Map)
    expect(memCache.lruBucket).toBeInstanceOf(Map)
    expect(memCache.config).toEqual(config)
  })

  test('数据类型 - 0 测试', () => {
    const type = 'user'

    const options: IMemCacheOptions = { cacheKey }

    const data = 0

    let result = memCache.set(type, options, data)

    expect(result).toBe(true)

    result = memCache.get(type, options)
    expect(result).toEqual(data)
  })

  test('数据类型 - null 测试', () => {
    const type = 'user'

    const options: IMemCacheOptions = { cacheKey }

    const data = null

    let result = memCache.set(type, options, data)

    expect(result).toBe(true)

    result = memCache.get(type, options)
    expect(result).toEqual(data)
  })

  test('数据类型 - false 测试', () => {
    const type = 'user'

    const options: IMemCacheOptions = { cacheKey }

    const data = false

    let result = memCache.set(type, options, data)

    expect(result).toBe(true)

    result = memCache.get(type, options)
    expect(result).toEqual(data)
  })

  test('缓存数据 往返 测试', () => {
    const type = 'user'

    const options: IMemCacheOptions = { cacheKey }

    const data = { id: 1, name: 'John Doe' }
    const cacheId = buildCacheId(cacheKey)

    const result = memCache.set(type, options, data)

    expect(result).toBe(true)

    const bucket = memCache.bucket.get(type)

    // 判断缓存桶是否存在
    expect(bucket).toBeInstanceOf(Map)

    const memCacheData: ICacheData | undefined = bucket?.get(cacheId)

    // 判断缓存数据是否存在
    expect(memCacheData).toBeInstanceOf(Object)

    const cacheData: ICacheData = {
      cacheId,
      cacheValue: data,
      timeOut: 0,
      cacheTime: 1008610010
    }

    // ??? 缓存时间不可预测 所以设置为 1008610010
    // @ts-ignore
    memCacheData?.cacheTime = 1008610010

    // 判断缓存数据是否正确
    expect(memCacheData).toEqual(cacheData)

    const memCacheValue = memCache.get(type, options)

    // 判断缓存数据是否正确
    expect(memCacheValue).toEqual(data)
  })

  test('缓存数据更新测试', () => {
    const type = 'user'

    const options: IMemCacheOptions = { cacheKey }

    const data = { id: 1, name: 'John Doe' }
    memCache.set(type, options, data)
    let cacheValue = memCache.get(type, options)

    // 判断缓存数据是否正确
    expect(cacheValue).toEqual(data)

    const newData = { id: 2, name: 'Jane Doe', desc: 'update' }
    memCache.update(type, options, newData)
    cacheValue = memCache.get(type, options)
    // 判断缓存数据是否正确
    expect(cacheValue).toEqual(newData)
  })

  test('删除缓存 及关联缓存 测试', () => {
    const options: IMemCacheOptions = { cacheKey }

    memCache = new MemCache({
      ...config,
      // 关联资源映射
      relatedResourceMapper: {
        user: ['friend']
      }
    })

    const userType = 'user'
    const userData = { id: 1, name: 'John Doe' }
    const userResult = memCache.set(userType, options, userData)

    // 判断缓存是否设置成功
    expect(userResult).toBe(true)

    let userMemCacheValue = memCache.get(userType, options)

    // 判断缓存数据是否正确
    expect(userMemCacheValue).toEqual(userData)

    const friendType = 'friend'
    const friendData = { id: 2, name: 'duo la', desc: "John Doe's friend" }
    const friendResult = memCache.set(friendType, options, friendData)

    // 判断缓存是否设置成功
    expect(friendResult).toBe(true)

    let friendMemCacheValue = memCache.get(friendType, options)
    // 判断缓存数据是否正确
    expect(friendMemCacheValue).toEqual(friendData)

    // 删除 user 缓存
    memCache.delete(userType, options)

    userMemCacheValue = memCache.get(userType, options)

    // 判断 user 缓存是否删除成功
    expect(userMemCacheValue).toBeUndefined()

    // 判断 friend 缓存是否删除成功
    friendMemCacheValue = memCache.get(friendType, options)

    expect(friendMemCacheValue).toBeUndefined()
  })
})
