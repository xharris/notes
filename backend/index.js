try {
  require('dotenv').config()
} catch (e) {}
const { backend } = require('./api')

backend.start({
  name: 'themepark',
  port: 4000,
  // whitelist: [process.env.APP_HOST],
  // skip_recursive_require: true,
  include_user_schema: true,
  //debug: true
})
