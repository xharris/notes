const { Api, ObjectId } = require('../api')
const { status, queryCheck, ref } = require('../api/util')

const tag = new Api('tag', {
  value: String,
  color: String,
})

const entry = new Api('entry', {
  user: ref('user'),
  ride: ref('ride'),
  text: String,
  status: {
    type: String,
    enum: ['DONE', 'PLANNED', 'NOPE'],
  },
  tags: [ref('tag')],
  rating: Number,
  times: Number,
  favorite: Boolean,
})

entry.auth.any = [{ method: 'put', path: '/' }, '/favorite/:ride']

// get '/?user=id&ride=:id'
entry.router.get('/', async (req, res) => {
  const ride = require('./ride')
  const body = {}
  if (req.query.user) body.user = ObjectId(req.query.user) // await user.model.findById(req.query.user).exec()
  if (req.query.ride)
    body.ride = await ride.model.findById(req.query.ride).exec()
  if (req.query.status && req.query.status.toLowerCase() !== 'all')
    body.status = req.query.status.toUpperCase()
  console.log(body)
  entry.model
    .find(body)
    .populate('ride tags')
    .populate({
      path: 'ride',
      populate: {
        path: 'park',
        model: 'park',
      },
    })
    .exec(
      (err, docs) => !queryCheck(res, err, docs) && status(200, res, { docs })
    )
})

// add new
entry.router.post('/', async (req, res) => {
  const tag = require('./tag')
  req.body.tags = await Promise.all(
    req.body.tags.map((value) =>
      tag.model.findOneAndUpdate(
        { value },
        { value },
        { new: true, upsert: true }
      )
    )
  )
  status(201, res, { _id: await entry.model.create(req.body) })
})

entry.router.put('/:id', async (req, res) => {
  const tag = require('./tag')
  const new_tags = []
  if (req.body.tags) {
    for (const value of req.body.tags) {
      new_tags.push(
        await tag.model.findOneAndUpdate(
          { value },
          { value },
          { new: true, upsert: true }
        )
      )
    }
  }
  entry.model
    .findOneAndUpdate(
      {
        _id: req.params.id,
        user: ObjectId(req.user._id),
      },
      { ...req.body, tags: new_tags },
      { new: true, upsert: true }
    )
    .exec((err, doc) => !queryCheck(res, err, doc) && status(200, res, { doc }))
})

entry.router.put('/favorite/:ride', (req, res) =>
  entry.model
    .findOneAndUpdate(
      { user: req.user._id, ride: req.params.ride },
      { favorite: true },
      { new: true, upsert: true }
    )
    .exec((err, doc) => !queryCheck(res, err, doc) && status(200, res, { doc }))
)

entry.router.put('/unfavorite/:ride', (req, res) =>
  entry.model
    .findOneAndUpdate(
      { user: req.user._id, ride: req.params.ride },
      { favorite: false },
      { new: true, upsert: true }
    )
    .exec((err, doc) => !queryCheck(res, err, doc) && status(200, res, { doc }))
)

module.exports = entry
