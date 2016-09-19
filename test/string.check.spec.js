'use strict';

const expect = require('chai').expect;
const sinon = require('sinon');
const checks = require('./fixtures/config/stringCheckFixture').checks;
const proxyquire = require('proxyquire').noCallThru().noPreserveCache();

describe('String Checker', function(){

	let StringCheck;
	let mockFetch;

	function setup(status, body, fixture){
		mockFetch = sinon.stub().returns(Promise.resolve({
			status: 200,
			ok: status < 300,
			text: () => Promise.resolve(body)
		}));
		const FetchCheck = proxyquire('../src/checks/fetchcheck', {'node-fetch':mockFetch});
		StringCheck = proxyquire('../src/checks/string.check', {'./fetchcheck':FetchCheck});
		return new StringCheck(checks[fixture || 0]);
	}

	it('Should be ok if the url returns the expected value', function(done){
		const check = setup(200, 'OK');
		check.start();
		setTimeout(function(){
			sinon.assert.calledWith(mockFetch, checks[0].url);
			sinon.assert.calledWith(mockFetch, checks[0].url, checks[0].fetchOptions);
			expect(check.getStatus().ok).to.be.true;
			done();
		});
	});

	it('Should not be ok if the url does not return the expected value', function(done){
		const check = setup(200, 'NOT OK');
		check.start();
		setTimeout(function(){
			sinon.assert.calledWith(mockFetch, checks[0].url);
			sinon.assert.calledWith(mockFetch, checks[0].url, checks[0].fetchOptions);
			expect(check.getStatus().ok).to.be.false;
			done();
		});
	});

	it('Should be ok if the callback returns true', function(done){
		const check = setup(200, 'OK', 1);
		check.start();
		setTimeout(function(){
			sinon.assert.calledWith(mockFetch, checks[1].url);
			sinon.assert.calledWith(mockFetch, checks[1].url, checks[1].fetchOptions);
			expect(check.getStatus().ok).to.be.true;
			done();
		});
	});

	it('Should not be ok if the callback returns false', function(done){
		const check = setup(200, 'NOT OK', 1);
		check.start();
		setTimeout(function(){
			sinon.assert.calledWith(mockFetch, checks[1].url);
			sinon.assert.calledWith(mockFetch, checks[1].url, checks[1].fetchOptions);
			expect(check.getStatus().ok).to.be.false;
			done();
		});
	});
});
