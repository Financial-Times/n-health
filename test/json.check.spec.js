'use strict';
var expect = require('chai').expect;
var mockery = require('mockery');
var sinon = require('sinon');


describe('JSON Checker', function(){

	var JsonCheck;
	var check;
	var nodeFetchMock;
	var config;

	function mockResponse(code, body){
		return Promise.resolve({
			status : code,
			ok : code < 400,
			json : function(){
				return Promise.resolve(body);
			}
		});
	}

	function setup(code,body){
		nodeFetchMock = sinon.stub().returns(mockResponse(code, body));
		mockery.registerMock('node-fetch', nodeFetchMock);
		mockery.enable({warnOnUnregistered:false, useCleanCache:true});
		config = require('./fixtures/jsonCheckFixture').checks[0];
		sinon.spy(config, 'callback');
		JsonCheck = require('../src/checks').json;
		check = new JsonCheck(config);
	}

	afterEach(function(){
		mockery.deregisterAll();
		mockery.resetCache();
		config.callback.restore();
	});

	after(function(){
		mockery.disable();
	});

	it('Should poll a given url and run the function passed in the config for each response', function(done){
		setup(200, {propertyToCheck:true});
		check.start();
		setTimeout(function(){
			sinon.assert.called(nodeFetchMock);
			sinon.assert.called(config.callback);
			done();
		}, 1100);
	});

	it('Should be ok if the callback function returns true', function(done){
		setup(200, {propertyToCheck:true});
		check.start();
		setTimeout(function(){
			expect(check.getStatus().ok).to.be.true;
			done();
		}, 1100);
	});

	it('Should not be ok if the callback returns false', function(done){
		setup(200, {propertyToCheck:false});
		check.start();
		setTimeout(function(){
			expect(check.getStatus().ok).to.be.false;
			done();
		}, 1100);
	});
});
