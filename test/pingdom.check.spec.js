'use strict';

const expect = require('chai').expect;
const fixture = require('./fixtures/config/pingdomCheckFixture.js').checks[0];
const sinon = require('sinon');
const proxyquire = require('proxyquire').noCallThru().noPreserveCache();

describe('Pingdom Check', function(){

	let check, PingdomCheck, mockFetch;

	function setup(status, body){
		mockFetch = sinon.stub().returns(Promise.resolve({
			status: status,
			ok: status < 300,
			json: () => Promise.resolve(body)
		}));
		PingdomCheck = proxyquire('../src/checks/pingdom.check', {'node-fetch':mockFetch});
		check = new PingdomCheck(fixture);
	}


	it('Should be able to contact pingdom to get the status of a given check', function(done){
		setup(200, {});
		check.start();
		setImmediate(() => {
			sinon.assert.called(mockFetch);
			let headers = mockFetch.lastCall.args[1].headers;
			expect(headers).to.have.property('App-Key');
			expect(headers).to.have.property('Account-Email');
			done();
		});
	});

	it('Should be ok if the pingdom status is "up', function(done){
		setup(200, require('./fixtures/pingdomUpResponse.json'));
		check.start();
		setImmediate(function(){
			expect(check.getStatus().ok).to.be.true;
			done();
		});
	});

	it('Should not be ok if the pingdom status is not "up', function(done){
		setup(200, require('./fixtures/pingdomDownResponse.json'));
		check.start();
		setImmediate(function(){
			expect(check.getStatus().ok).to.be.false;
			done();
		});
	});

	it('Should not be ok if the status check failed', function(done){
		setup(500, {});
		check.start();
		setImmediate(function(){
			expect(check.getStatus().ok).to.be.false;
			done();
		});
	});

	it('should return error message if pingdom returns a 403 status', function(done) {
		setup(403, require('./fixtures/pingdom403Response.json'));
		check.start();
		setImmediate(function(){
			expect(check.getStatus().checkOutput).to.eql('Failed to get status: Pingdom API returned 403: Something went wrong! This string describes what happened.');
			done();
		});
	});

});
