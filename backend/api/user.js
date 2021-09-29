const { Api, backend } = require('.')
const {
  status,
  secureHash,
  verifyHash,
  securePass,
  queryCheck,
  ref,
} = require('./util')
const { generateJwt } = require('./jwt')
const ms = require('ms')
const atob = require('atob')

const adj = [
  'Epic',
  'Sneaky',
  'Spicy',
  'Cool',
  'Jumping',
  'American',
  'British',
  'Random',
  'Funny',
  'Handsome',
]
const name = ['Jessie', 'James', 'Astronaut', 'Jack', 'Sniper', 'Boy', 'Girl']
const random = (arr) => arr[Math.floor(Math.random() * arr.length)]
const random_username = () => [random(adj), random(name)].join('_')

const user = new Api('user', {
  id: { type: String, unique: true, required: true }, // used to identify user for authentication
  email: String,
  username: String,
  display_name: {
    type: String,
    default: function () {
      return this.username
    },
  },
  avatar: String,
  type: { type: Number, enum: ['user', 'admin', 'api'] },
  private: { type: Boolean, default: false },
  theme: {
    primary: { type: String, default: '#E0E0E0' },
    secondary: { type: String, default: '#FFFFFF' },
    font: { type: String },
    header_char: { type: String, default: '\\' },
  },
  pwd: {
    type: String,
    select: false, // .select("+password") to retrieve
    toJSON: { getters: true },
    toObject: { getters: true },
  },
  following: [ref('user')],
})

user.schema.static('usernameToDocId', async function (username) {
  const doc = await this.findOne({ username })
  if (doc) {
    return doc._id
  }
})

user.auth.any = ['/verify', '/theme/update', /\/displayname\b/]

user.router.post('/add', async (req, res) => {
  req.body.pwd = await secureHash(req.body.pwd)
  const doc = await user.model.create(req.body)
  if (!doc.username) {
    doc.username = random_username()
    doc.display_name = doc.username.replace('_', ' ')
    await doc.save()
  }
  status(201, res, {
    doc,
  })
})
user.router.post('/get', (req, res) =>
  user.model
    .find()
    .where(req.body.key || '_id')
    .in(req.body.values)
    .exec(
      (err, docs = []) =>
        !queryCheck(res, err, docs.length > 0) &&
        status(200, res, {
          users: docs.map((d) => d.toJSON()),
        })
    )
)
user.router.post('/verify', async (req, res) => {
  const doc = await user.model.findOne({ id: req.user.id })
  if (queryCheck(res, 'USER_NOT_FOUND', doc))
    return status(401, res, { message: 'NOT_AUTHORIZED' })
  return status(200, res, { data: doc })
})
user.router.post('/logout', async (req, res) => {
  backend.cookie('auth', res, '0', {
    maxAge: 0,
    signed: true,
    httpOnly: true,
  })
  return status(200, res)
})
user.router.post('/login', async (req, res) => {
  const [id, pwd] = atob(req.header('authorization')).split(':')
  const doc = await user.model.findOne({ id }).select('+pwd').exec()
  const deny = () => status(403, res, { message: 'BAD_LOGIN' })
  const accept = async () => {
    backend.cookie('auth', res, generateJwt(doc.id), {
      ...(req.body.remember
        ? {
            maxAge: ms('100 years'),
          }
        : {}),
      httpOnly: true,
      signed: true,
    })
    const user_doc = await user.model.findOne({ id: doc.id })
    if (queryCheck(res, 'USER_NOT_FOUND', user_doc))
      return status(401, res, { message: 'NOT_AUTHORIZED' })
    return status(200, res, { data: user_doc })
  }

  if (!pwd || !doc) return deny()
  const result = await verifyHash(pwd, doc.pwd)

  switch (result) {
    case securePass.VALID:
      return accept()

    case securePass.VALID_NEEDS_REHASH:
      doc.pwd = await secureHash(doc.pwd)
      await doc.save()
      return accept()

    default:
      return deny()
  }
})

user.router.get('/theme/:username', (req, res) =>
  user.model
    .findOne({ username: req.params.username }, 'theme')
    .exec((err, doc) => !queryCheck(res, err, doc) && status(200, res, doc))
)

user.router.put('/theme/update', (req, res) =>
  user.model.updateOne(
    { id: req.user.id },
    {
      $set: {
        'theme.primary': req.body.primary,
        'theme.secondary': req.body.secondary,
      },
    },
    { runValidators: true, omitUndefined: true },
    (err, doc) => {
      if (!queryCheck(res, err, doc)) {
        status(200, res)
        user.emit('update-theme', req.user.username)
      }
    }
  )
)

// /search?q=query
user.router.get('/search', async (req, res) => {
  const term = decodeURI(req.query.q)
  return status(200, res, {
    docs:
      !term || term.length === 0
        ? []
        : await user.model
            .find({
              $or: [
                {
                  username: new RegExp(term, 'i'),
                },
                {
                  display_name: new RegExp(term, 'i'),
                },
              ],
            })
            .lean(),
  })
})

user.router.put('/displayname', (req, res) =>
  user.model
    .updateOne({
      _id: req.user._id,
      display_name: req.body.name,
    })
    .exec((err, doc) => !queryCheck(res, err, doc) && status(200, res, doc))
)

user.router.post('/displayname/get', (req, res) =>
  user.model
    .find({ ...req.body, pwd: null }, 'display_name')
    .exec((err, doc) => !queryCheck(res, err, doc) && status(200, res, doc))
)

module.exports = { user }
