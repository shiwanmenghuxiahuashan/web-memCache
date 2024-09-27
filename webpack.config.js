const path = require('path')

const isProduction = process.env.NODE_ENV == 'production'

const config = {
  entry: './src/index.ts',
  output: {
    filename: 'web-memcache.js',
    path: path.resolve(__dirname, 'dist'),
    clean: true,
    library: {
      name: 'web-memcache',
      type: 'umd'
    }
  },
  // 其他配置项...
  stats: {
    errorDetails: true
  },
  devServer: {
    open: true,
    host: 'localhost'
  },
  module: {
    rules: [
      {
        test: /\.(ts|tsx)$/i,
        loader: 'ts-loader',
        exclude: ['/node_modules/']
      },
      {
        test: /\.(eot|svg|ttf|woff|woff2|png|jpg|gif)$/i,
        type: 'asset'
      }
    ]
  },
  resolve: {
    extensions: ['.tsx', '.ts', '.jsx', '.js', '...']
  }
}

module.exports = () => {
  if (isProduction) {
    config.mode = 'production'
  } else {
    config.mode = 'development'
  }
  return config
}
