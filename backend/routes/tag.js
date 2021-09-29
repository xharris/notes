const { Api } = require('../api')
const { status, queryCheck, ref } = require('../api/util')

const tag = new Api('tag', {
  value: { type: String, text: true },
  color: { type: String, default: '#B0BEC5' },
})

module.exports = tag
