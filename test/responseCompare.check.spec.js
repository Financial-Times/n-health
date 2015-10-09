'use strict';
require('babel/register');
var expect = require('chai').expect;
var mockery = require('mockery');
var sinon = require('sinon');

describe('Response Compare Check', function(){

	var ResponseCompareCheck;
	var check;

	var response1 = 'blah';
	var response2 = 'blah';

	function MockResponse(body){
		this.body = body;
	}

	MockResponse.prototype.text = function(){
		return Promise.resolve(this.body);
	};

	var fetchMock = sinon.stub();
	fetchMock.onCall(0).returns(new MockResponse(response1));
	fetchMock.onCall(1).returns(new MockResponse(response2));
	fetchMock.onCall(2).returns(new MockResponse(response1));
	fetchMock.onCall(3).returns(new MockResponse(response2));


	before(function(){
		mockery.registerMock('node-fetch', fetchMock);
		mockery.enable({warnOnUnregistered:false, useCleanCache:true});
		var config = require('./fixtures/responseCompareFixture').checks[0];
		ResponseCompareCheck = require('../src/checks').responseCompare;
		check = new ResponseCompareCheck(config);
	});

	after(function(){
		mockery.disable();
	});

	describe('equal', function(){

		it('Will pass if the 2 responses are the same', function(done){
			check.start();
			setTimeout(function(){
				expect(check.getStatus().ok).to.be.true;
				done();
			}, 1500);
		});
	})

});
