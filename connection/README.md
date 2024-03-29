interface-connection
==================

[![](https://img.shields.io/badge/made%20by-Protocol%20Labs-blue.svg?style=flat-square)](http://protocol.ai)
[![](https://img.shields.io/badge/project-libp2p-yellow.svg?style=flat-square)](http://libp2p.io/)
[![](https://img.shields.io/badge/freenode-%23libp2p-yellow.svg?style=flat-square)](http://webchat.freenode.net/?channels=%23libp2p)
[![Discourse posts](https://img.shields.io/discourse/https/discuss.libp2p.io/posts.svg)](https://discuss.libp2p.io)
[![](https://img.shields.io/codecov/c/github/libp2p/interface-connection.svg?style=flat-square)](https://codecov.io/gh/libp2p/interface-connection)
[![](https://img.shields.io/travis/libp2p/interface-connection.svg?style=flat-square)](https://travis-ci.com/libp2p/interface-connection)
[![Dependency Status](https://david-dm.org/libp2p/interface-connection.svg?style=flat-square)](https://david-dm.org/libp2p/interface-connection)
[![js-standard-style](https://img.shields.io/badge/code%20style-standard-brightgreen.svg?style=flat-square)](https://github.com/feross/standard)

This is a test suite and interface you can use to implement a connection. A connection is understood as something that offers mechanism for writing and reading data, back pressure, half and full duplex streams. This module and test suite were heavily inspired by abstract-blob-store and interface-stream-muxer.

The primary goal of this module is to enable developers to pick, swap or upgrade their connection without losing the same API expectations and mechanisms such as back pressure and the ability to half close a connection.

Publishing a test suite as a module lets multiple modules all ensure compatibility since they use the same test suite.

The API is presented with both Node.js and Go primitives, however, there is no actual limitations for it to be extended to any other language, pushing forward the cross compatibility and interop through diferent stacks.

## Lead Maintainer

[Jacob Heun](https://github.com/jacobheun/)

# Modules that implement the interface

- [js-libp2p-tcp](https://github.com/libp2p/js-libp2p-tcp)
- [js-libp2p-webrtc-star](https://github.com/libp2p/js-libp2p-webrtc-star)
- [js-libp2p-websockets](https://github.com/libp2p/js-libp2p-websockets)
- [js-libp2p-utp](https://github.com/libp2p/js-libp2p-utp)
- [webrtc-explorer](https://github.com/diasdavid/webrtc-explorer)
- [js-libp2p-spdy](https://github.com/libp2p/js-libp2p-spdy)
- [js-libp2p-multiplex](https://github.com/libp2p/js-libp2p-multiplex)
- [js-libp2p-secio](https://github.com/libp2p/js-libp2p-secio)

# Badge

Include this badge in your readme if you make a module that is compatible with the interface-connection API. You can validate this by running the tests.

![](https://raw.githubusercontent.com/diasdavid/interface-connection/master/img/badge.png)

# How to use the battery of tests

## Node.js

```
var tape = require('tape')
var tests = require('interface-connection/tests')
var YourConnectionHandler = require('../src')

var common = {
  setup: function (t, cb) {
    cb(null, YourConnectionHandler)
  },
  teardown: function (t, cb) {
    cb()
  }
}

tests(tape, common)
```

## Go

> WIP

# API

A valid (read: that follows this abstraction) connection, must implement the following API.

**Table of contents:**

- type: `Connection`
  - `conn.getObservedAddrs(callback)`
  - `conn.getPeerInfo(callback)`
  - `conn.setPeerInfo(peerInfo)`
  - `...`

### Get the Observed Addresses of the peer in the other end

- `JavaScript` - `conn.getObservedAddrs(callback)`

This method retrieves the observed addresses we get from the underlying transport, if any.

`callback` should follow the follow `function (err, multiaddrs) {}`, where `multiaddrs` is an array of [multiaddr](https://github.com/multiformats/multiaddr).

### Get the PeerInfo

- `JavaScript` - `conn.getPeerInfo(callback)`

This method retrieves the a Peer Info object that contains information about the peer that this conn connects to.

`callback` should follow the `function (err, peerInfo) {}` signature, where peerInfo is a object of type [Peer Info](https://github.com/libp2p/js-peer-info)

### Set the PeerInfo

- `JavaScript` - `conn.setPeerInfo(peerInfo)`
j
This method stores a reference to the peerInfo Object that contains information about the peer that this conn connects to.

`peerInfo` is a object of type [Peer Info](https://github.com/diasdavid/js-peer-info)

---

notes:
  - should follow the remaining Duplex stream operations
  - should have backpressure into account
  - should enable half duplex streams (close from one side, but still open for the other)
  - should support full duplex
  - tests should be performed by passing two streams
