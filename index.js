if (process.env.NODE_ENV === 'production') {
  module.exports = require('./dist/web-memcache.js')
} else {
  module.exports = require('./dist/cjs/src/index.js')
}
