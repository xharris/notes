const jwt = require("jsonwebtoken")

const generateJwt = (data, opt) => jwt.sign({ data }, process.env.JWT_KEY, opt)

const verifyJwt = (token, cb) => jwt.verify(token, process.env.JWT_KEY, cb)

module.exports = {
  generateJwt,
  verifyJwt
}
