'use strict';

var _ = require('lodash');
var chai = require('chai');
var sinon = require('sinon');
var should = chai.should();
var Client = require('../../lib/client');
var API = Client.API;
var Bitcore = require('bitcore');
var TestData = require('./clienttestdata');

describe(' client API ', function() {

  var client;

  beforeEach(function() {

    var fsmock = {};;
    fsmock.readFile = sinon.mock().yields(null, JSON.stringify(TestData.storage.wallet11));
    fsmock.writeFile = sinon.mock().yields();
    var storage = new Client.FileStorage({
      filename: 'dummy',
      fs: fsmock,
    });
    client = new Client({
      storage: storage
    });
  });

  describe(' _tryToComplete ', function() {
    it('should complete a wallet ', function(done) {
      var request = sinon.stub();

      // Wallet request
      request.onCall(0).yields(null, {
        statusCode: 200,
      }, TestData.serverResponse.completeWallet);
      request.onCall(1).yields(null, {
        statusCode: 200,
      }, "pepe");

      client.request = request;
      client.storage.fs.readFile = sinon.stub().yields(null, JSON.stringify(TestData.storage.incompleteWallet22));
      client.getBalance(function(err, x) {
        should.not.exist(err);
        done();
      });
    })


    it('should handle incomple wallets', function(done) {
      var request = sinon.stub();

      // Wallet request
      request.onCall(0).yields(null, {
        statusCode: 200,
      }, TestData.serverResponse.incompleteWallet);

      client.request = request;
      client.storage.fs.readFile = sinon.stub().yields(null, JSON.stringify(TestData.storage.incompleteWallet22));
      client.createAddress(function(err, x) {
        err.should.contain('Incomplete');
        done();
      });
    })

    it('should reject wallets with bad signatures', function(done) {
      var request = sinon.stub();
      // Wallet request
      request.onCall(0).yields(null, {
        statusCode: 200,
      }, TestData.serverResponse.corruptWallet22);

      client.request = request;
      client.storage.fs.readFile = sinon.stub().yields(null, JSON.stringify(TestData.storage.incompleteWallet22));
      client.createAddress(function(err, x) {
        err.should.contain('verified');
        done();
      });
    })
    it('should reject wallets with missing signatures ', function(done) {
      var request = sinon.stub();
      // Wallet request
      request.onCall(0).yields(null, {
        statusCode: 200,
      }, TestData.serverResponse.corruptWallet222);

      client.request = request;
      client.storage.fs.readFile = sinon.stub().yields(null, JSON.stringify(TestData.storage.incompleteWallet22));
      client.createAddress(function(err, x) {
        err.should.contain('verified');
        done();
      });
    })

    it('should reject wallets missing caller"s pubkey', function(done) {
      var request = sinon.stub();
      // Wallet request
      request.onCall(0).yields(null, {
        statusCode: 200,
      }, TestData.serverResponse.missingMyPubKey);

      client.request = request;
      client.storage.fs.readFile = sinon.stub().yields(null, JSON.stringify(TestData.storage.incompleteWallet22));
      client.createAddress(function(err, x) {
        err.should.contain('verified');
        done();
      });
    })


  });

  describe(' createAddress ', function() {
    it(' should check address ', function(done) {

      var response = {
        createdOn: 1424105995,
        address: '2N3fA6wDtnebzywPkGuNK9KkFaEzgbPRRTq',
        path: 'm/2147483647/0/7',
        publicKeys: ['03f6a5fe8db51bfbaf26ece22a3e3bc242891a47d3048fc70bc0e8c03a071ad76f']
      };
      var request = sinon.mock().yields(null, {
        statusCode: 200
      }, response);
      client.request = request;


      client.createAddress(function(err, x) {
        should.not.exist(err);
        x.address.should.equal('2N3fA6wDtnebzywPkGuNK9KkFaEzgbPRRTq');
        done();
      });
    })
    it(' should detect fake addresses ', function(done) {
      var response = {
        createdOn: 1424105995,
        address: '2N3fA6wDtnebzywPkGuNK9KkFaEzgbPRRTq',
        path: 'm/2147483647/0/8',
        publicKeys: ['03f6a5fe8db51bfbaf26ece22a3e3bc242891a47d3048fc70bc0e8c03a071ad76f']
      };
      var request = sinon.mock().yields(null, {
        statusCode: 200
      }, response);
      client.request = request;
      client.createAddress(function(err, x) {
        err.code.should.equal('SERVERCOMPROMISED');
        err.message.should.contain('fake address');
        done();
      });
    })
  })
});