const { status, queryCheck } = require('../api/util')
const { user } = require('../api/user')
const mongoose = require('mongoose')
const { ObjectId } = require('../api')

user.auth.any.push({ method: 'put', path: '/' })

user.router.get('/:id', (req, res) =>
  user.model
    .findById(req.params.id)
    .exec((err, doc) => !queryCheck(res, err, doc) && status(200, res, { doc }))
)

user.router.put('/', (req, res) => {
  user.model
    .findOneAndUpdate({ _id: ObjectId(req.user._id) }, req.body.data, {
      new: true,
    })
    .exec((err, doc) => !queryCheck(res, err, doc) && status(200, res, { doc }))
})

// get '/:id/tags/top'
user.router.get('/:id/tags/top', async (req, res) => {
  const entry = require('./entry')
  const doc_user = await user.model.find({ id: req.params.id })
  if (queryCheck(res, `User ${req.params.id} not found`, doc_user)) return null
  const doc_entries = await entry.model
    .find({ user: doc_user })
    .sort({ _id: 1 })
    .limit(5)
    .exec()
  if (
    !queryCheck(res, `Entries not found for User ${req.params.id}`, doc_entries)
  )
    status(200, res, { docs: doc_entries })
})

user.router.put('/follow/:id', async (req, res) => {
  if (req.user) {
    // unfollow
    if (req.user.following.includes(req.params.id))
      return user.model
        .findOneAndUpdate(
          { _id: ObjectId(req.user._id) },
          { $pull: { following: ObjectId(req.params.id) } }
        )
        .exec((err, doc) => !queryCheck(res, err, doc) && status(200, res, doc))
    // follow
    if (!req.user.following.includes(req.params.id))
      return user.model
        .findOneAndUpdate(
          { _id: ObjectId(req.user._id) },
          { $push: { following: ObjectId(req.params.id) } }
        )
        .exec((err, doc) => !queryCheck(res, err, doc) && status(200, res, doc))
  }
  queryCheck(res, 'Need user auth key')
})
