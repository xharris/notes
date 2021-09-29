/**
 * Setup:
 *
 * yarn add dotenv express querystring mongoose nanoid atob morgan body-parser jsonwebtoken secure-password cookie-parser express-fileupload helmet socket.io
 *
 * Usage:
 *
 * const { api, schema, types } = require("./api")
 *
 * const thing = schema({
 *   value: types.Mixed
 * })
 *
 * const new_api_table = api("new_api_table", {
 *   name: String,
 *   other_table_doc: ref('other_table_name'),
 *   otherthing: { type: [thing], default: [] }
 * })
 *
 * new_api_table.router.add()
 *
 */

const { randomColor, status } = require('./util')
const { verifyJwt } = require('./jwt')

const nanoid = require('nanoid')
const mongoose = require('mongoose')
const express = require('express')
const { readdir } = require('fs')
const { join } = require('path')
const querystring = require('querystring')

const is_dev = process.env.NODE_ENV === 'development'

const checkSchema = (obj) => {
  for (const v in obj) {
    switch (obj[v]) {
      case 'shortid':
        obj[v] = { type: String, default: () => nanoid(10) }
        break
      case 'color':
        obj[v] = { type: String, default: () => randomColor() }
        break
      default:
        break
    }
  }
  return obj
}

const Schema = (obj, options, ...args) => {
  const schema = new mongoose.Schema(
    checkSchema(obj),
    {
      ...options,
      timestamps: {
        createdAt: 'date_created',
        updatedAt: 'date_modified',
      },
    },
    ...args
  )

  // schema.statics.add =
  /*
  const query_check = function (doc) {
    const r = queryCheck(res, "USER_NOT_FOUND", doc)
    console.log("find middleware")
    //next()
  }
  schema.post("findOne", query_check)
*/
  return schema
}

const models = {}
const Model = (name, _schema) => {
  if (!models[name]) models[name] = mongoose.model(name, _schema)
  return models[name]
}

const Router = (opt) => {
  express.Router()
}

const apis = {}
class Api {
  constructor(name, ...args) {
    this.name = name
    if (args.length > 0) this.schema = Schema(...[].concat(...args))
    this.router = express.Router()
    if (this.schema) this.createModel()

    this.router.use((req, res, accept) => {
      if (this.schema) this.createModel()

      const deny = (err) => status(403, res, { message: err || 'BAD_TOKEN' })
      var needs_auth = []

      for (var authtype in this.auth) {
        if (
          this.auth[authtype].some((p) => {
            if (typeof p === 'string') return req.path.match(p)
            else {
              return (
                (!req.method || req.method === p.method) &&
                (!req.path || req.path.match(p.path))
              )
            }
          })
        )
          needs_auth.push(authtype)
      }

      const { user } = require('./user')
      const token = req.signedCookies[backend.cookie('auth')]
      if (!token && needs_auth.length > 0) return deny('NO_TOKEN') // no id or token given
      return new Promise((pres, rej) => {
        // decode the jwt
        verifyJwt(token, (err, data) => {
          if (err && needs_auth.length === 0) return accept()
          if (err) return deny()
          // verify user exists
          user.model.findOne({ id: data.data }).exec(async function (err, doc) {
            if (err || !doc) return deny('USER_NOT_FOUND') // user not found
            if (
              !(needs_auth.length === 0 || needs_auth.includes('any')) &&
              !needs_auth.includes(doc.type)
            )
              deny('NOT_AUTHORIZED')
            // success
            req.user = doc
            return accept()
          })
        })
      })
    })

    if (this.router) backend.app.use(`/api/${this.name}`, this.router)
    this.auth = {}

    this.namespace = backend.io.of(`/${this.name}`)

    this.namespace.on('connection', (socket) => {
      //console.log("connected", this.name, socket.id)
      socket.on('disconnect', () => {
        //console.log("disconnected", this.name, socket.id)
      })
    })

    apis[this.name] = this
  }
  emit(evt, data) {
    console.log(`${this.name}/${evt}`, data)
    this.namespace.emit(evt, data)
  }
  get model() {
    this.createModel()
    return this._model
  }
  use(path, ...args) {
    return backend.app.use(`/api/${this.name}${path}`, ...args)
  }
  createModel() {
    if (this.schema) this._model = Model(this.name, this.schema)
  }
  static get(...names) {
    return names.map((n) => apis[n])
  }
}

const backend = {
  start: (options) => {
    const express = require('express')
    const bodyParser = require('body-parser')
    const cors = require('cors')
    const cookieParser = require('cookie-parser')
    const fileUpload = require('express-fileupload')
    const app = express()

    backend.app = app
    backend.options = options

    const { port } = options

    const corsOptions = {
      credentials: true,
      origin: true /*(origin, callback) => {
        if (whitelist.indexOf(origin) !== -1 || !origin) {
          callback(null, true)
        } else {
          callback(new Error("Not allowed by CORS"))
        }
      }*/,
    }

    const helmet = require('helmet') // creates headers to protect from attacks
    const morgan = require('morgan') // logs requests

    if (is_dev) {
      app.use(
        helmet.contentSecurityPolicy({
          directives: {
            defaultSrc: ["'self'"],
            connectSrc: ["'self'"],
            frameSrc: ["'self'"],
            childSrc: ["'self'"],
            scriptSrc: ["'self'"],
            styleSrc: ["'self'", 'https://fonts.googleapis.com'],
            fontSrc: ["'self'", 'https://fonts.gstatic.com'],
            imgSrc: ["'self'"],
            baseUri: ["'self'"],
          },
        })
      )
    }
    app.use(cors(corsOptions))
    app.use(
      bodyParser.urlencoded({
        extended: true,
      })
    )
    app.use(
      bodyParser.json({
        limit: '8mb',
        extended: true,
      })
    )
    app.use(morgan('tiny')) // tiny/combined
    app.use(cookieParser(process.env.JWT_KEY))
    app.use(
      fileUpload({
        createParentPath: true,
        safeFileNames: true,
        preserveExtension: true,
      })
    )

    const mongoose = require('mongoose')
    mongoose.set('debug', options.debug)
    // mongoose.set('useFindAndModify', false)
    // mongoose.set('useCreateIndex', true)

    const mongo_url = is_dev
      ? `mongodb://localhost:27017/${options.name}`
      : `mongodb+srv://${process.env.DB_USER}:${encodeURI(
          process.env.DB_PASS
        )}@${process.env.DB_HOST}/${options.name}?retryWrites=true&w=majority`
    const mg_opts = is_dev
      ? {}
      : {
          user: process.env.DB_USER,
          password: process.env.DB_PASS,
        }

    mongoose
      .connect(mongo_url, {
        ...mg_opts,
        useNewUrlParser: true,
        useUnifiedTopology: true,
      })
      .catch((e) => {
        console.error('Connection error', e.message)
      })
    mongoose.pluralize(null)
    const db = mongoose.connection

    db.on('error', console.error.bind(console, 'MongoDB connection error:'))

    //if (!is_dev) {
    if (options.static) {
      const path_build = join(__dirname, '..', '..', '..')
      app.use(express.static(path_build))
      app.get(/^(?!\/api).*/, (req, res) => {
        const path = req.path
        if (['.js', '.html', '.css'].some((e) => path.endsWith(e)))
          res.sendFile(path_build)
        else res.sendFile(join(path_build, 'index.html'))
      })
    }
    //}

    const requireDir = (dir, no_recursion) =>
      new Promise((res, rej) => {
        readdir(dir, { withFileTypes: true }, (err, files) => {
          if (err) return rej()
          const imports = []
          files.forEach((f) => {
            if (f.isDirectory() && !no_recursion) requireDir(join(dir, f.name))
            else if (f.isFile() && f.name !== 'index.js') {
              imports.push(join(dir, f.name))
            }
          })
          Promise.all(imports.map((f) => require(f)))
            .then(res)
            .catch(console.error)
        })
      })

    // api subscription
    const server = require('http').Server(app)
    backend.io = require('socket.io')(server, {
      cors: {
        origin: true,
      },
    })

    const rest_url = is_dev
      ? `http://localhost:${process.env.PORT || port}`
      : `${window.location.host}:${process.env.PORT || port}`

    requireDir(
      join(__dirname, '../routes'),
      options.skip_recursive_require
    ).then(() => {
      server.listen(process.env.PORT || port, () =>
        console.log(
          `Server running!\n\t${rest_url}\n\tMongoDB url: ${mongo_url}`
        )
      )
    })

    if (options.include_user_schema) {
      require('./user')
    }
  },
  cookie: (key, res, ...args) =>
    res
      ? res.cookie(`${backend.options.name}_${key}`, ...args)
      : `${backend.options.name}_${key}`,
}

module.exports = {
  checkSchema,
  Api,
  Schema,
  Model,
  Router,
  backend,
  express,
  ObjectId: mongoose.Types.ObjectId,
}
