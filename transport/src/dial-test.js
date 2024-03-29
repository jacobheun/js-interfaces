/* eslint-env mocha */
'use strict'

const chai = require('chai')
const dirtyChai = require('dirty-chai')
const expect = chai.expect
chai.use(dirtyChai)

const goodbye = require('it-goodbye')
const { collect } = require('streaming-iterables')
const pipe = require('it-pipe')
const AbortController = require('abort-controller')
const AbortError = require('./errors').AbortError

module.exports = (common) => {
  describe('dial', () => {
    let addrs
    let transport
    let connector
    let listener

    before(async () => {
      ({ addrs, transport, connector } = await common.setup())
    })

    after(() => common.teardown && common.teardown())

    beforeEach(() => {
      listener = transport.createListener((conn) => pipe(conn, conn))
      return listener.listen(addrs[0])
    })

    afterEach(() => listener.close())

    it('simple', async () => {
      const conn = await transport.dial(addrs[0])

      const s = goodbye({ source: ['hey'], sink: collect })

      const result = await pipe(s, conn, s)

      expect(result.length).to.equal(1)
      expect(result[0].toString()).to.equal('hey')
    })

    it('to non existent listener', async () => {
      try {
        await transport.dial(addrs[1])
      } catch (_) {
        // Success: expected an error to be throw
        return
      }
      expect.fail('Did not throw error attempting to connect to non-existent listener')
    })

    it('abort before dialing throws AbortError', async () => {
      const controller = new AbortController()
      controller.abort()
      const socket = transport.dial(addrs[0], { signal: controller.signal })

      try {
        await socket
      } catch (err) {
        expect(err.code).to.eql(AbortError.code)
        expect(err.type).to.eql(AbortError.type)
        return
      }
      expect.fail('Did not throw error with code ' + AbortError.code)
    })

    it('abort while dialing throws AbortError', async () => {
      // Add a delay to connect() so that we can abort while the dial is in
      // progress
      connector.delay(100)

      const controller = new AbortController()
      const socket = transport.dial(addrs[0], { signal: controller.signal })
      setTimeout(() => controller.abort(), 50)

      try {
        await socket
      } catch (err) {
        expect(err.code).to.eql(AbortError.code)
        expect(err.type).to.eql(AbortError.type)
        return
      } finally {
        connector.restore()
      }
      expect.fail('Did not throw error with code ' + AbortError.code)
    })

    it('abort while reading throws AbortError', async () => {
      // Add a delay to the response from the server
      async function * delayedResponse (source) {
        for await (const val of source) {
          await new Promise((resolve) => setTimeout(resolve, 1000))
          yield val
        }
      }
      const delayedListener = transport.createListener(async (conn) => {
        await pipe(conn, delayedResponse, conn)
      })
      await delayedListener.listen(addrs[1])

      // Create an abort signal and dial the socket
      const controller = new AbortController()
      const socket = await transport.dial(addrs[1], { signal: controller.signal })

      try {
        // Set a timeout to abort before the server responds
        setTimeout(() => controller.abort(), 100)

        // An AbortError should be thrown before the pipe completes
        const s = goodbye({ source: ['hey'], sink: collect })
        await pipe(s, socket, s)
      } catch (err) {
        expect(err.code).to.eql(AbortError.code)
        expect(err.type).to.eql(AbortError.type)
        return
      } finally {
        await delayedListener.close()
      }
      expect.fail('Did not throw error with code ' + AbortError.code)
    })

    it('abort while writing does not throw AbortError', async () => {
      // Record values received by the listener
      const recorded = []
      async function * recorderTransform (source) {
        for await (const val of source) {
          recorded.push(val)
          yield val
        }
      }
      const recordListener = transport.createListener(async (conn) => {
        await pipe(conn, recorderTransform, conn)
      })
      await recordListener.listen(addrs[1])

      // Create an abort signal and dial the socket
      const controller = new AbortController()
      const socket = await transport.dial(addrs[1], { signal: controller.signal })

      // Set a timeout to abort before writing has completed
      setTimeout(() => controller.abort(), 100)

      try {
        // The pipe should write to the socket until aborted
        await pipe(
          async function * () {
            yield 'hey'
            await new Promise((resolve) => setTimeout(resolve, 200))
            yield 'there'
          },
          socket)
        expect(recorded.length).to.eql(1)
        expect(recorded[0].toString()).to.eql('hey')
      } finally {
        await recordListener.close()
      }
    })
  })
}
