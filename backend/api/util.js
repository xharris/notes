const mongoose = require("mongoose")
const securePass = require("secure-password")
const pwd = securePass()

const ref = (name, ...args) => ({
  type: mongoose.Types.ObjectId,
  ref: name,
  ...args,
})

const types = mongoose.Types

const queryCheck = (res, err, doc) => {
  if (err && err.code) {
    switch (err.code) {
      case 11000: // duplicate key
        return status(403, res, { message: `DUPLICATE` })
      default:
        return status(500, res, { message: err.message })
    }
  }
  if (!doc) return status(404, res, { message: err || "NOT_FOUND" })
}

const status = (code, res, props) => {
  if (!props) props = {}
  if (!props.message && code >= 200 && code < 300) props.message = "SUCCESS"
  if (res.statusCode !== 200) return // error already happened
  try {
    if (typeof props === "object" && props !== null)
      res.status(code).json({ ...props })
    else {
      console.log(props)
      res.status(code).send(props)
    }
  } catch (e) {
    console.log(`ERROR: path(${res.req.originalUrl})`)
    console.log(e)
  }
}

const secureHash = async (str) => await pwd.hash(Buffer.from(str))
const verifyHash = async (str, hash) =>
  await pwd.verify(Buffer.from(str), Buffer.from(hash))

const colors = [
  "#ffcdd2",
  "#E1BEE7",
  "#C5CAE9",
  "#B3E5FC",
  "#C8E6C9",
  "#FFF9C4",
  "#FFCC80",
  "#BCAAA4",
  "#CFD8DC",
]

const randomColor = () => colors[Math.floor(Math.random() * colors.length)]

const asyncFilter = async (cb, arr) => await Promise.all(arr.filter(cb))
const asyncMap = async (cb, arr) => await Promise.all(arr.map(cb))

module.exports = {
  ref,
  types,
  queryCheck,
  status,
  secureHash,
  securePass,
  verifyHash,
  randomColor,
  asyncFilter,
  asyncMap,
}
