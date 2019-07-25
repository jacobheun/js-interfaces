'use strict'

const expect = require('chai').expect

const pair = require('pull-pair/duplex')
const pull = require('pull-stream')
const generate = require('pull-generate')
const each = require('async/each')
const eachLimit = require('async/eachLimit')
const setImmediate = require('async/setImmediate')

module.exports = (muxer, nStreams, nMsg, done, limit) => {
  const p = pair()
  const dialerSocket = p[0]
  const listenerSocket = p[1]

  const check = marker((6 * nStreams) + (nStreams * nMsg), done)

  const msg = 'simple msg'

  const listener = muxer.listener(listenerSocket)
  const dialer = muxer.dialer(dialerSocket)

  listener.on('stream', (stream) => {
    expect(stream).to.exist // eslint-disable-line
    check()
    pull(
      stream,
      pull.through((chunk) => {
        expect(chunk).to.exist // eslint-disable-line
        check()
      }),
      pull.onEnd((err) => {
        expect(err).to.not.exist // eslint-disable-line
        check()
        pull(pull.empty(), stream)
      })
    )
  })

  const numbers = []
  for (let i = 0; i < nStreams; i++) {
    numbers.push(i)
  }

  const spawnStream = (n, cb) => {
    const stream = dialer.newStream((err) => {
      expect(err).to.not.exist // eslint-disable-line
      check()
      expect(stream).to.exist // eslint-disable-line
      check()
      pull(
        generate(0, (s, cb) => {
          setImmediate(() => {
            cb(s === nMsg ? true : null, msg, s + 1)
          })
        }),
        stream,
        pull.collect((err, res) => {
          expect(err).to.not.exist // eslint-disable-line
          check()
          expect(res).to.be.eql([])
          check()
          cb()
        })
      )
    })
  }

  if (limit) {
    eachLimit(numbers, limit, spawnStream, () => {})
  } else {
    each(numbers, spawnStream, () => {})
  }
}

function marker (n, done) {
  let i = 0
  return (err) => {
    i++

    if (err) {
      /* eslint-disable-next-line */
      console.error('Failed after %s iterations', i)
      return done(err)
    }

    if (i === n) {
      done()
    }
  }
}
