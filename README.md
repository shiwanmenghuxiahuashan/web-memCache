# web-memcache

`web-memcache` 是在前端使用的内存缓存，主要用于数据，减少网络请求，提高页面加载速度，配合合理的缓存方案与 "数据层" 可做到全自动缓存与更新，删除缓存。

## 起步

### 安装

```bash
# npm
npm install web-memcache
# yarn 
yarn add web-memcache
# pnpm 推荐
pnpm add web-memcache
```

### 基础用法  

```js
import MemCache from 'web-memcache';
// 创建一个缓存实例
const memCache = new MemCache();
/**
 * 数据资源类型
 * - 如果为 restful 风格的接口，则为资源名称 - ex: 'user' 
 * - 如果为 其他接口风格 则为接口名称 - ex: 'getUserInfo' 或 '/goodsList/recommend'
 * - 核心本质是 memCache 通过数据资源类型进行数据缓存的，无论是资源类型，还是数据接口url，都是为了区分不同的数据资源
 */
const dataResourceType = 'user';

/**
 * 缓存选项
 * - cacheKey: 缓存键值，用于区分不同的缓存数据, 字符串直接作为缓存id 对象则根据其生成缓存id
 * - timeOut: 缓存过期时间，单位毫秒，默认为 0，即永不过期,可以不传,在此处设置只会对单条缓存数据生效
 */
const memCacheOptions = {
    cacheKey: {
        id: 1
    },
    timeOut: 0
}

/**
 * 缓存数据
 * - 支持缓存对象，数组，字符串，null，布尔 数据类型
 * - 需要注意：判断缓存值是否存在应判断获取的缓存值是否 "不为" undefined, 因为缓存值可以为 null，0，false 等值。
 * - 关于 NaN 值，NaN 与任何值都不相等，包括它自己。这意味着 NaN !== NaN 是 true。要检查一个值是否是 NaN，你可以使用 Number.isNaN()
 */
const cacheDataValue = {
    id: 1,
    name: '张三',
    age: 18
}

// 设置缓存
memCache.set(dataResourceType, memCacheOptions, cacheDataValue)

/**
 * 获取缓存
 * - 与设置缓存对应，通过数据资源类型和缓存选项获取缓存数据
 * - 获取缓存数据，如果缓存数据不存在则返回 undefined
 * - 如果缓存数据存在，但是已经过期，则返回 undefined
 * - 如果缓存数据存在，且未过期，则返回缓存数据
 */
const cacheValue = memCache.get(dataResourceType, memCacheOptions);

console.log(cacheValue) // { id: 1, name: '张三', age: 18 }

// 对数据进行更新
cacheDataValue.age = 19

// 再次调用设置缓存，将会引发错误，因为缓存数据已经存在 
// 此限制防止隐式更新缓存数据，隐式更新缓存数据会导致缓存数据不可控 与 debug 困难
memCache.set(dataResourceType, memCacheOptions, cacheDataValue)

// 如果需要更新缓存数据，应该显式调用更新缓存数据方法
memCache.update(dataResourceType, memCacheOptions, cacheDataValue)

/**
 * 删除缓存
 * - 通过数据资源类型和缓存选项删除缓存数据
 * - 删除缓存数据，如果缓存数据不存在则返回 false
 * - 删除缓存数据，如果缓存数据存在，则返回 true
 */
const deleteResult = memCache.delete(dataResourceType, memCacheOptions);

console.log(deleteResult) // true

// 再次获取缓存数据，将会返回 undefined
const cacheValue2 = memCache.get(dataResourceType, memCacheOptions);
console.log(cacheValue2) // undefined
```

## API

### new MemCache(options: IDefaultConfig)

实例化缓存

IDefaultConfig 为默认配置项，可以通过实例化时传入配置项进行配置。

```ts
 interface IDefaultConfig {
     /**
      * 按资源缓存最大限制
      * - 默认 10 
      */
     limit ? : number
     /**
      *  缓存过期时间戳
      * - 默认无过期时间 即 0
      */
     timeOut ? : number
     /**
      * 是否打印缓存日志
      * - 默认打印
      */
     cacheLog ? : boolean
     /**
      * 关联资源映射
      * - ex: { user: 'friend' } | { user: ['friend', 'boss'] }
      * - 当key资源发生非GET请求时，删除关联资源的缓存
      * - 主要用以处理隐式联动的数据关系
      * - 例如：当 card 数据存在已读状态 read 时，read 状态更新，触发 post ,删除 card
      * 防止 命中缓存，再次触发 read 状态更新，服务器返回 409 重复创建
      */
     relatedResourceMapper ? : Record < string, string | string[] >
 }
```

* limit: 按资源缓存最大限制，默认 10
    - 传递 0 则不限制缓存数据
    - 当缓存数据超过限制时，会按lru算法 删除掉最少使用缓存数据
    - 以 资源类型 'user' 为例，当缓存数据超过 10 条时，会按lru算法 删除掉最少使用缓存数据
    - lru 算法在 get,set,update 操作时会更新缓存数据 使用次数 以保证最新使用的数据不会被删除

* timeOut: 缓存过期时间戳，默认无过期时间 即 0
    - 毫秒为单位，传递 0 则不设置缓存过期时间
    - 当缓存数据存在过期时间时，会在缓存数据过期后删除缓存数据
    - 过期时间是以缓存数据时创建的时间戳 `cacheTime` (`Date.now()`) 为基准
    - 过期计算方式为 `Date.now() - cacheTime >= timeOut` 则缓存数据过期
* cacheLog: 是否打印缓存日志，默认打印
    - 传递 true 则打印缓存日志
    - 传递 false 则不打印缓存日志
    - 设置，更新，删除和命中缓存数据时会打印对应日志，方便调试，可在开发环境打印，生产环境不打印
* relatedResourceMapper: 关联资源映射，当key资源发生非GET请求时，删除关联资源的缓存
    - ex: { user: 'friend' } | { user: ['friend] } 其中 user 为 key 资源，friend 为关联资源
    - 接口，资源设计应以消费者为主，web开发中对应的消费者就是前端，但前端往往无法有效的主导后端接口设计，导致接口设计不合理，数据不可控等情况发生。
    - 经常会有 a 接口发生 post,patch,delete 请求时，间接影响到 b 接口的数据。假如已缓存a,b两个接口数据，a 接口发生 post 请求，b 接口数据应该被删除，否则会命中缓存，返回陈旧数据
    - 通过关联资源映射，可以在 a 接口发生 post 请求时，删除 b 接口的缓存数据，保证数据的实时性
    - ex：memcache.delete('user', { id: 1 }) 时，会删除 friend 资源的缓存数据

### memCache.set(type: string, options: IMemCacheOptions, data: any)

**设置缓存数据**，成功后返回 `true` ，失败返回 `false`

* `type` 为数据资源类型
*  `options` 为缓存选项
* `data ` 为要缓存数据

`IMemCacheOptions` 为缓存选项，包含 `timeOut` 和 `cacheKey`

```ts
interface IMemCacheOptions {
  /**
   * 缓存过期时间
   * - 默认无过期时间 即 0
   * - 只对当前资源缓存有效
   * - 毫秒为单位
   */
  timeOut?: number

  /**
   * 缓存key
   * - 字符串直接作为缓存id
   * - 对象则根据其生成缓存id
   */
  cacheKey: string | Record<string, any>
}
```

* `timeOut`: **缓存过期时间，单位毫秒，默认为 0，即永不过期**
    - 它与 `new MemCache(options: IDefaultConfig)` 中的 `timeOut` 不同，`IMemCacheOptions` 中的 `timeOut` 是局部配置，只对当前资源缓存有效
    - 当 `IMemCacheOptions` 中的 `timeOut` 为 0 时，会使用 `new MemCache(options: IDefaultConfig)` 中的 `timeOut`，即全局配置

* `cacheKey`: **缓存键值，用于区分不同的缓存数据**
    - 字符串直接作为缓存id
    - 对象则根据其生成缓存id
    - 缓存键值的唯一性，决定了缓存数据的唯一性
    

**memCache.update(type: string, options: IMemCacheOptions, data: any)** 与 `set` 使用方式一致，唯一不同是 `update` 用于更新缓存数据，当缓存数据已存在时，调用 `update` 方法更新缓存数据，否则会引发错误。

### memCache.get(type: string, options: IMemCacheOptions)

**获取缓存数据**，命中缓存返回缓存数据，未命中或缓存数据过期返回 `undefined`

 与 `set` 方法唯一不同，不需要传递缓存数据 `data`

```js
// 通过对象作为缓存键值 获取缓存数据
memCache.get('goods', {
    cacheKey: {
        pagination: {
            page: 1,
            pageSize: 10
        },
        sort: {
            price: 'asc'
        },
        filter: {
            phone: {
                op: 'ct',
                value: 'iphone'
            },
            price: {
                op: 'gt',
                value: 1000
            },
            time: {
                op: 'bt',
                value: '2024-01-01,2024-09-26'
            }
        }
    }
})
```

## memCache.delete(type: string, options: IDelMemCacheOptions)

**删除缓存数据**，成功后返回 `true` ，失败返回 `false`

IDelMemCacheOptions 为删除缓存选项，包含 `cacheKey` 和 `deleteRelatedResource`

```ts
interface IDelMemCacheOptions {
  /**
   * 缓存key
   * - 可选的
   */
  cacheKey?: CacheKey
  /**
   * 是否删除关联资源缓存
   * - 可选的
   */
  deleteRelatedResource?: boolean
}
```

* `cacheKey`: **缓存键值，用于区分不同的缓存数据**
    - 如不传递 `cacheKey`，则删除所有`type`缓存数据

* `deleteRelatedResource`: **是否删除关联资源缓存**
    - 默认为 `true`
    - 实例化 memecache 时 ，传递关系资源映射为 `{'user':'friend'}`,在调用`memcache.delete('user')` 时，会删除 `friend` 资源的缓存数据
    - 传递 `false` 则 **禁用** 删除关联资源缓存数据

## 关于cacheKey 实际应用

"商品资源"为 `goods` , 前端进行分页请求 ，每次请求10条数据

首次获取 10 条商品信息，请求参数为 { page: 1, pageSize: 10 }，编码后的url为：https://www.ex.com/goods?pagination[page]=1&pagination[pageSize]=10

翻页至 第二页 获取 10 条商品信息，请求参数为 { page: 2, pageSize: 10 }，编码后的url为：https://www.ex.com/goods?pagination[page]=2&pagination[pageSize]=10

此时 cacheKey 可使用 url 作为缓存键值，这样就可以区分不同的商品信息 即：

```js
// 第一页商品信息
memCache.set('goods', {
    cacheKey: 'https://www.ex.com/goods?pagination[page]=1&pagination[pageSize]=10'
}, goodsData)

// 第二页商品信息
memCache.set('goods', {
    cacheKey: 'https://www.ex.com/goods?pagination[page]=2&pagination[pageSize]=10'
}, goodsData)
```

考虑到 url 包含了 `origin` , 实际业务中可能从多个域名获取 `goods` 数据, 且在缓存数据时已指定资源类型，所以去掉 `origin` 与对应资源也可行, 即：

```js
// 第一页商品信息
memCache.set('goods', {
    cacheKey: 'pagination[page]=1&pagination[pageSize]=10'
}, goodsData)

// 第二页商品信息
memCache.set('goods', {
    cacheKey: 'pagination[page]=2&pagination[pageSize]=10'
}, goodsData)
```

甚至自己构建缓存键值，如：

```js
// 第一页商品信息
memCache.set('goods', {
    cacheKey: 'pn=1&ps=10'
}, goodsData)

// 第二页商品信息
memCache.set('goods', {
    cacheKey: 'pn=2&ps=10'
}, goodsData)
```

影响数据区分的因素有很多，如 排序，过滤，分页等，可以根据实际业务需求进行缓存键值的设计：

```js
// 通过对象作为缓存键值
memCache.set('goods', {
    cacheKey: {
        pagination: {
            page: 1,
            pageSize: 10
        },
        sort: {
            price: 'asc'
        },
        filter: {
            phone: {
                op: 'ct',
                value: 'iphone'
            },
            price: {
                op: 'gt',
                value: 1000
            },
            time: {
                op: 'bt',
                value: '2024-01-01,2024-09-26'
            }
        }
    }
}, goodsData)
```

   

# # 注意事项
1. 因为实现方式是基于内存缓存(`new Map()`)， 所以在页面刷新或者关闭页面时， 缓存数据会被清空， 所以在使用时需要注意缓存数据的生命周期。
2. 缓存数据的更新， 删除， 获取都是基于数据资源类型和缓存选项(`
cacheKey `)， 所以在使用时需要注意数据资源类型和缓存选项(` cacheKey`) 的唯一性。
3. 缓存选项`
cacheKey`
可以是字符串 或 对象。 如果是字符串， 则直接作为缓存键值， 此时需要注意缓存键值的唯一性。 如果是对象， 请最小限度控制对象大小， 以免生成过长的 cacheId。

## Authors

* **lichonglou** - work in beijng

## License

This project is licensed under the MIT License - see the [LICENSE.md](LICENSE.md) file for details
