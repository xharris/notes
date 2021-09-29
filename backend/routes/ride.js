const { user } = require('../api/user')
const { Api, ObjectId } = require('../api')
const { status, queryCheck, ref } = require('../api/util')
const tag = require('./tag')

const ride = new Api('ride', {
  name: { type: String, text: true },
  park: ref('park'),
  images: [String],
})

ride.schema.set('toObject', { virtuals: true })
ride.schema.set('toJSON', { virtuals: true })

ride.schema.methods.getTopTags = function (cb) {
  const entry = require('./entry')
  return entry.model
    .aggregate([
      {
        $match: {
          ride: this._id,
        },
      },
      {
        $unwind: {
          path: '$tags',
        },
      },
      {
        $lookup: {
          from: 'tag',
          localField: 'tags',
          foreignField: '_id',
          as: 'tag',
        },
      },
      {
        $unwind: {
          path: '$tag',
        },
      },
      {
        $group: {
          _id: '$tag',
          count: {
            $sum: 1,
          },
        },
      },
      {
        $sort: {
          count: -1,
        },
      },
      {
        $limit: 3,
      },
    ])
    .exec()
}

// /search?q=query
ride.router.get('/search', async (req, res) => {
  const parts = decodeURI(req.query.q)
    .toLowerCase()
    .split(' ')
    .filter((p) => p.length > 0)
  const tags = parts.filter((p) => p.startsWith('#')).map((p) => p.slice(1))
  const name = parts
    .filter((p) => !p.startsWith('#'))
    .filter((p) => p.length !== 0)
    .join(' ')
  // console.log(`search\n\tname: "${name}"\n\ttags: "${tags}"`)
  // const rideFind = {
  //   name: { $regex: name, $options: 'i' },
  // }
  // if (tags.length > 0) {
  //   const entries = await entry.model
  //     .find({ 'tabs.$value': { $in: tags } })
  //     .select('ride -_id')
  //     .lean()
  //     .exec()
  //   rideFind._id = {
  //     $in: entries.map((e) => ({
  //       _id: e.ride,
  //     })),
  //   }
  // }
  const rideFind = []
  rideFind.push(
    // get user's entry
    req.user
      ? {
          $lookup: {
            from: 'entry',
            localField: '_id',
            foreignField: 'ride',
            as: 'user_entry',
            pipeline: [
              {
                $match: {
                  user: req.user._id,
                },
              },
            ],
          },
        }
      : {
          $set: {
            user_entry: [],
          },
        },
    {
      $unwind: {
        path: '$user_entry',
        preserveNullAndEmptyArrays: true,
      },
    },
    // populate park
    {
      $lookup: {
        from: 'park',
        localField: 'park',
        foreignField: '_id',
        as: 'park',
      },
    },
    {
      $unwind: '$park',
    },
    // get top X entry tags
    {
      $lookup: {
        from: 'entry',
        localField: '_id',
        foreignField: 'ride',
        as: 'tags',
        pipeline: [
          {
            $unwind: {
              path: '$tags',
            },
          },
          {
            $lookup: {
              from: 'tag',
              localField: 'tags',
              foreignField: '_id',
              as: 'tag',
            },
          },
          {
            $unwind: {
              path: '$tag',
            },
          },
          {
            $group: {
              _id: '$tag',
              count: {
                $sum: 1,
              },
            },
          },
          {
            $sort: {
              count: -1,
            },
          },
          {
            $limit: 4,
          },
        ],
      },
    },
    // get favories
    {
      $lookup: {
        from: 'entry',
        localField: '_id',
        foreignField: 'ride',
        as: 'favorites',
      },
    },
    {
      $set: {
        entries: {
          $size: '$favorites',
        },
      },
    },
    {
      $set: {
        favorites: {
          $size: {
            $filter: {
              input: '$favorites',
              cond: {
                $eq: ['$$this.favorite', true],
              },
            },
          },
        },
      },
    }
  )
  if (name.length > 0) {
    rideFind.push({
      $match: {
        name: new RegExp(name, 'i'),
      },
    })
  }
  if (tags.length > 0) {
    rideFind.push(
      // {
      //   $lookup: {
      //     from: 'tag',
      //     localField: 'tags',
      //     foreignField: '_id',
      //     as: 'tags',
      //   },
      // },
      {
        $match: {
          'tags._id.value': {
            $in: tags,
          },
        },
      }
    )
  }
  ride.model.aggregate(rideFind).exec((err, docs) => {
    if (!queryCheck(res, err, docs)) status(200, res, { docs })
  })
})

ride.router.get('/:id', async (req, res) => {
  const doc = await ride.model
    .aggregate([
      {
        $match: {
          _id: ObjectId(req.params.id),
        },
      },
      {
        $lookup: {
          from: 'entry',
          localField: '_id',
          foreignField: 'ride',
          as: 'tags',
        },
      },
      {
        $lookup: {
          from: 'park',
          localField: 'park',
          foreignField: '_id',
          as: 'park',
        },
      },
      {
        $unwind: '$park',
      },
      {
        $lookup: {
          from: 'tag',
          localField: 'tags.tags._id',
          foreignField: 'ride',
          as: 'tags',
          pipeline: [
            // vvvv might need to comment out if not getting unique values correctly
            {
              $group: {
                _id: { _id: '$_id', value: '$value', color: '$color' },
                count: {
                  $sum: 1,
                },
              },
            },
            // ^^^^
          ],
        },
      },
      {
        $lookup: {
          from: 'entry',
          localField: '_id',
          foreignField: 'ride',
          as: 'entries',
        },
      },
    ])
    .exec()
  // if (doc) doc.getTopTags()
  if (!queryCheck(res, `Ride with id ${req.params.id} not found`, doc))
    status(200, res, { doc: doc[0] })
})

module.exports = ride
