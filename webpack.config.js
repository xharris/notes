const path = require('path')
const HtmlWebpackPlugin = require('html-webpack-plugin')
const { GenerateSW } = require('workbox-webpack-plugin')
const DotEnv = require('dotenv-webpack')

const mode = process.env.NODE_ENV || 'development'
const dev = mode !== 'production'
const target = process.env.TARGET

const settings = {
  mode,
  entry: {
    app: './src/main.tsx',
    // "service-worker": "./src/service-worker.js",
  },
  target: target, // === 'electron-renderer' ? 'web' : target,
  output: {
    path: path.resolve(__dirname, 'public'),
    publicPath: target === 'electron-renderer' ? './' : '/',
    filename: 'bundle.[contenthash].js',
    clean: true,
  },
  devtool: 'source-map',
  // devtool: dev ? 'eval-cheap-module-source-map' : 'source-map',
  resolve: {
    extensions: ['.tsx', '.ts', '.js', '.jsx'],
    alias: {
      component: path.resolve(__dirname, 'src/component/'),
      style: path.resolve(__dirname, 'src/style/'),
      ui: path.resolve(__dirname, 'src/ui/'),
      // preact
      react: 'preact/compat',
      'react-dom/test-utils': 'preact/test-utils',
      'react-dom': 'preact/compat', // Must be below test-utils
      'react/jsx-runtime': 'preact/jsx-runtime',
    },
  },
  devServer: {
    // bonjour: {
    //   type: "https",
    // },
    static: {
      directory: path.join(__dirname, 'public'),
      serveIndex: true,
    },
    historyApiFallback: true,
    devMiddleware: {
      writeToDisk: true,
    },
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: path.resolve(__dirname, 'src/index.html'),
      noCache: dev,
    }),
    new DotEnv(),
    // new GenerateSW({
    //   clientsClaim: true,
    //   skipWaiting: true,
    // }),

    // new InjectManifest({
    //   swSrc: path.resolve(__dirname, "src/sw.js"),
    //   swDest: "service-worker.js",
    //   // include: [
    //   //   /\.html$/,
    //   //   /\.js$/,
    //   //   /\.css$/,
    //   //   /\.woff2$/,
    //   //   /\.jpg$/,
    //   //   /\.png$/
    //   // ],
    //   // maximumFileSizeToCacheInBytes: 100 * 1024 * 1024,
    //   // exclude: [/\.map$/, /asset-manifest\.json$/]
    // }),
  ],
  module: {
    rules: [
      {
        test: /\.webmanifest$/,
        use: [
          {
            loader: 'file-loader',
            options: {
              name: '[name].[ext]',
            },
          },
          {
            loader: 'webmanifest-loader',
          },
        ],
      },
      {
        test: /\.s[ac]ss$/i,
        use: [
          // Creates `style` nodes from JS strings
          'style-loader',
          // Translates CSS into CommonJS
          'css-loader',
          // Compiles Sass to CSS
          'sass-loader',
        ],
      },
      {
        test: /(\.d)?\.tsx?$/,
        use: 'ts-loader',
        exclude: /node_modules/,
      },
      {
        test: /\.m?js$/,
        exclude: /(node_modules|bower_components)/,
        use: {
          loader: 'babel-loader?cacheDirectory',
          // options: {
          //   presets: ['@babel/preset-env'],
          // },
        },
      },
    ],
  },
}

module.exports = settings
// fix from https://github.com/GoogleChrome/workbox/issues/1790
// withPWA({
//   ...settings,
//   pwa: {
//     disable: mode === 'development',
//     register: true,
//     scope: '/app',
//     sw: 'service-worker.js',
//   }
// })
