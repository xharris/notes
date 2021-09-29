const { Api } = require('../api')
const { status, queryCheck, ref } = require('../api/util')

const park = new Api('park', {
  name: String,
  address: String,
  // color: String,
})

park.router.get('/:id/rides', async (req, res) => {
  const ride = require('./ride')
  const doc_park = await park.model.findById(req.params.id)
  ride.model
    .find({ park: doc_park })
    .exec(
      (err, docs) => !queryCheck(res, err, docs) && status(200, res, { docs })
    )
})

park.router.get('/search', (req, res) => {
  const parts = decodeURI(req.query.q)
    .split(' ')
    .filter((p) => p.length > 0)
  const tags = parts.filter((p) => p.startsWith('#')).map((p) => p.slice(1))
  const name = parts
    .filter((p) => !p.startsWith('#'))
    .filter((p) => p.length !== 0)
    .join(' ')
    .toLowerCase()
  console.log(tags)

  park.model
    .aggregate([
      {
        $lookup: {
          from: 'ride',
          localField: '_id',
          foreignField: 'park',
          as: 'rides',
          pipeline: [
            {
              $lookup: {
                from: 'entry',
                localField: '_id',
                foreignField: 'ride',
                as: 'entries',
                pipeline: [
                  {
                    $lookup: {
                      from: 'tag',
                      localField: 'tags',
                      foreignField: '_id',
                      as: 'tags',
                      pipeline: [
                        {
                          $match: {
                            $expr: {
                              $or: [
                                tags.length === 0,
                                {
                                  $in: ['$value', tags],
                                },
                                // below is an attempt to match all given tags
                                // {
                                //   $and: tags.map((t) => ({
                                //     $eq: ['$value', t],
                                //   })),
                                // },
                              ],
                            },
                          },
                        },
                      ],
                    },
                  },
                  {
                    $match: {
                      $expr: {
                        $gt: [{ $size: '$tags' }, 0],
                      },
                    },
                  },
                ],
              },
            },
            {
              $match: {
                $expr: {
                  $and: [
                    {
                      $or: [
                        name.length === 0,
                        {
                          $regexMatch: {
                            input: '$name',
                            regex: new RegExp(name, 'i'),
                          },
                        },
                      ],
                    },
                    {
                      $or: [
                        tags.length === 0,
                        {
                          $gt: [{ $size: '$entries' }, 0],
                        },
                      ],
                    },
                  ],
                },
              },
            },
          ],
        },
      },
    ])
    .exec((err, docs) => {
      if (!queryCheck(res, err, docs)) status(200, res, { docs })
    })
})

module.exports = park
