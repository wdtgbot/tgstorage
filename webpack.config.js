/* eslint-disable */
const path = require('path')
const webpack = require('webpack')
const dotenv = require('dotenv')
const HtmlPlugin = require('html-webpack-plugin')
//const HtmlPreloadPlugin = require('@vue/preload-webpack-plugin')
const MiniCssExtractPlugin = require('mini-css-extract-plugin')
const CopyPlugin = require('copy-webpack-plugin')
const TerserPlugin = require('terser-webpack-plugin')
const CssMinimizerPlugin = require('css-minimizer-webpack-plugin')
const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin
const SentryPlugin = require('@sentry/webpack-plugin')
const autoprefixer = require('autoprefixer')

const isProd = () => process.env.NODE_ENV === 'production'
const isDev = () => !isProd()
const isStage = () => process.env.BUILD_ENV === 'stage'
const isBundleAnalyzer = () => !!process.env.BUNDLE_ANALYZER

const appEnv = isDev() ? dotenv.config({
  path: `./.env.${process.env.BUILD_ENV}`
}) : process.env

const defineEnvConfig = {
  'process.env.BUILD_ENV': JSON.stringify(appEnv.BUILD_ENV),
  'process.env.NODE_ENV': JSON.stringify(appEnv.NODE_ENV),
  'process.env.API_ID': JSON.stringify(appEnv.API_ID),
  'process.env.API_HASH': JSON.stringify(appEnv.API_HASH),
  'process.env.API_TEST': JSON.stringify(appEnv.API_TEST),
  'process.env.INVITE_RU': JSON.stringify(appEnv.INVITE_RU),
  'process.env.INVITE_EN': JSON.stringify(appEnv.INVITE_EN),
  'process.env.SENTRY_DSN': JSON.stringify(appEnv.SENTRY_DSN),
  'process.env.SENTRY_AUTH_TOKEN': JSON.stringify(appEnv.SENTRY_AUTH_TOKEN)
}

const resolveOptions = {
  extensions: [
    '.mjs', '.js', '.jsx', '.tsx', '.ts', '.js', '.json',
    '.wasm', '.css', '.styl', '.html', '.svg', '.jpg', '.png'
  ],
  alias: {
    '~': path.resolve('./src')
  }
}

const mainFields = ['esm2017', 'module', 'jsnext:main', 'browser', 'main']

const terserOptions = {
  compress: {
    ecma: 2019
  },
  output: {
    ecma: 2019,
    beautify: false,
    comments: false,
    ascii_only: true
  }
}

module.exports = [{
  mode: isDev() ? 'development' : 'production',

  target: 'web',

  entry: {
    app: './src/core/app.tsx'
  },

  output: {
    path: path.resolve('./build'),
    filename: isDev() ? `[name].js` : `[name].[contenthash:8].js`,
    chunkFilename: isDev() ? `[name].js` : `[name].[contenthash:8].js`,
    publicPath: process.env.ASSETS_HOST || '/'
  },

  experiments: {
    topLevelAwait: true
  },

  resolve: resolveOptions,

  module: {
    rules: [{
        test: /\.worker\.ts?$/,
        exclude: /node_modules\/(?!(idb-keyval|pako)\/).*/,
        use: [{
          loader: 'worker-loader'
        }, {
          loader: 'babel-loader'
        }]
      } ,{
        test: /\.m?[jt]sx?$/,
        exclude: /node_modules\/(?!(comlink)\/).*/,
        resolve: { mainFields },
        use: [{
          loader: 'babel-loader'
        }]
      }, {
        test: /\.styl$/,
        use: [{
          loader: isDev() ? 'style-loader' : MiniCssExtractPlugin.loader,
          options: {
            esModule: true,
          }
        }, {
          loader: 'css-loader',
          options: {
            esModule: true,
            modules: {
              localIdentName: isDev() ? '[name]__[local]--[hash:base64:8]' : '[hash:base64:8]',
              exportLocalsConvention: 'asIs'
            },
            sourceMap: isDev()
          }
        }, {
          loader: 'postcss-loader',
          options: {
            postcssOptions: {
              plugins: [autoprefixer],
            },
            sourceMap: isDev()
          }
        }, {
          loader: 'stylus-loader',
          options: {
            stylusOptions: {
              import: [path.resolve('./src/ui/styles/styles.vars.styl')],
            },
            sourceMap: isDev()
          }
        }]
      }, {
        test: /\.css$/,
        use: [{
          loader: isDev() ? 'style-loader' : MiniCssExtractPlugin.loader,
          options: {
            esModule: true,
          }
        }, {
          loader: 'css-loader'
        }, {
          loader: 'postcss-loader',
          options: {
            postcssOptions: {
              plugins: [autoprefixer],
            },
            sourceMap: isDev()
          }
        }]
      }, {
        test: /\.(avif|webp|png)$/,
        type: 'asset/resource'
      }, {
        test: /\.svg$/,
        use: ['preact-svg-loader'],
      }
    ]
  },

  plugins: [
    new webpack.DefinePlugin(defineEnvConfig),

    new HtmlPlugin({
      template: './src/core/app.html',
      filename: 'index.html',
      inject: true,
      minify: {
        collapseWhitespace: true,
        keepClosingSlash: true,
        minifyCSS: true,
        minifyJS: true,
        removeComments: true
      }
    }),

    /*new HtmlPreloadPlugin({
      rel: 'preload',
      include: 'allAssets',
      fileBlacklist: [/^[0-9]*\./, /\.map/, /\.jpe?g/]
    }),*/

    isProd() ? new MiniCssExtractPlugin({
      filename: '[name].[contenthash:8].css',
      chunkFilename: '[name].[contenthash:8].css'
    }) : () => {},

    new CopyPlugin({
      patterns: [
        { from: './src/core/app.webmanifest', to: './app.v1.webmanifest' },
        { from: './src/ui/images/*', to: './[name].v1[ext]' }
      ]
    }),

    (isProd() && !isBundleAnalyzer()) ? new SentryPlugin({
      authToken: appEnv.SENTRY_TOKEN || process.env.SENTRY_AUTH_TOKEN,
      org: 'alexander-shershnev',
      project: 'tgstorage',
      include: './build',
      deploy: {
        env: process.env.BUILD_ENV
      }
    }) : () => {},

    isBundleAnalyzer() ? new BundleAnalyzerPlugin({
      analyzerHost: '0.0.0.0',
      analyzerPort: 5002
    }) : () => {}
  ],

  optimization: {
    nodeEnv: isDev() ? 'development' : 'production',
    //chunkIds: 'named',
    splitChunks: {
      chunks: 'all'
    },
    concatenateModules: false,
    minimize: isProd(),
    minimizer: isProd() ? [
      new TerserPlugin({ terserOptions }),
      new CssMinimizerPlugin()
    ] : []
  },

  devtool: isDev() ? 'eval-cheap-module-source-map' : 'hidden-source-map',

  devServer: {
    //https: true,
    host: '0.0.0.0',
    port: 5000,
    hot: true,
    historyApiFallback: true,
    compress: true,
    client: {
      overlay: {
        warnings: false,
        errors: true
      }
    }
  },

  stats: {
    children: isBundleAnalyzer(),
    modules: isBundleAnalyzer()
  }
}, {
  mode: isDev() ? 'development' : 'production',

  target: 'webworker',

  entry: {
    sw: { import: './src/sw/sw.ts', filename: 'sw.js' }
  },

  output: {
    path: path.resolve('./build'),
    filename: isDev() ? `sw.[name].js` : `sw.[name].[contenthash:8].js`,
    chunkFilename: isDev() ? `sw.[name].js` : `sw.[name].[contenthash:8].js`,
    publicPath: process.env.ASSETS_HOST || '/'
  },

  resolve: resolveOptions,

  module: {
    rules: [{
      test: /\.m?[jt]sx?$/,
      resolve: { mainFields },
      use: [{
        loader: 'babel-loader'
      }]
    }]
  },

  plugins: [
    new webpack.DefinePlugin(defineEnvConfig),

    isBundleAnalyzer() ? new BundleAnalyzerPlugin({
      analyzerHost: '0.0.0.0',
      analyzerPort: 5003
    }) : () => {}
  ],

  optimization: {
    nodeEnv: isDev() ? 'development' : 'production',
    //chunkIds: 'named',
    splitChunks: {
      chunks: 'all'
    },
    concatenateModules: false,
    minimize: isProd(),
    minimizer: isProd() ? [
      new TerserPlugin({ terserOptions })
    ] : []
  },

  stats: {
    children: isBundleAnalyzer(),
    modules: isBundleAnalyzer()
  }
}]
