import type { IDefaultConfig } from './type'
/**
 * 默认配置
 */
const defaultConfig: IDefaultConfig = {
  limit: 10,
  timeOut: 0,
  cacheLog: true,
  relatedResourceMapper: {}
}

/**
 * 合并配置
 * @param config
 * @returns
 */
const mergeConfig = (config: IDefaultConfig): IDefaultConfig => {
  return { ...defaultConfig, ...config }
}

export { defaultConfig, mergeConfig }
