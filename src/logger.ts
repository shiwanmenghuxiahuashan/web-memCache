class Logger {
  constructor(settings = {}) {
    this.isConsole = settings.cacheLog || true
  }

  log(...args) {
    if (!this.isConsole) return
    // eslint-disable-next-line no-console
    console.log(`[memCache] :`, ...args)
  }

  error(...args) {
    if (!this.isConsole) return
    console.error(`[memCache] :`, ...args)
  }
  warn(...args) {
    if (!this.isConsole) return
    // eslint-disable-next-line no-console
    console.warn(`[memCache] :`, ...args)
  }
}

export { Logger }