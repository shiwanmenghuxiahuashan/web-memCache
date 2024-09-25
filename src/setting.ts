import { DefaultConfig } from './type'
/**
 * 默认配置
 */
const defaultConfig: DefaultConfig = {
  limt: 10,
  timeOut: 0,
  cacheLog: true,
  relatedResourceMapper: {}
}

/**
 * 合并配置
 * @param config
 * @returns
 */
const mergeConfig = (config: DefaultConfig): DefaultConfig => {
  return { ...defaultConfig, ...config }
}

export { defaultConfig, mergeConfig }
