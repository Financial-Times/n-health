'use strict';

const expect = require('chai').expect;
const sinon = require('sinon');
const proxyquire = require('proxyquire').noCallThru().noPreserveCache();
const config = require('./fixtures/config/responseCompareFixture').checks;

describe('Response Compare Check', function(){


	let ResponseCompareCheck;
	let mockFetch;

	function setup (bodies, config) {
		mockFetch = sinon.stub();
		bodies.forEach((body, i) => {
			mockFetch.onCall(i).returns(Promise.resolve({
				status: 200,
				ok: true,
				text: () => Promise.resolve(body)
			}));
		});
		ResponseCompareCheck = proxyquire('../src/checks/responseCompare.check', {'node-fetch':mockFetch});
		return new ResponseCompareCheck(config);
	}

	describe('equal', function(){

		it('Will pass if the 2 responses are the same', function(done){
			const check = setup(['hip', 'hip'], config[0]);
			check.start();
			setImmediate(function(){
				sinon.assert.called(mockFetch);
				expect(check.getStatus().ok).to.be.true;
				check.stop();
				done();
			});
		});

		it('Will fail if the 2 responses are different', function(done){
			const check = setup(['hur', 'rah'], config[0]);
			check.start();
			setImmediate(function(){
				sinon.assert.called(mockFetch);
				expect(check.getStatus().ok).to.be.false;
				check.stop();
				done();
			});
		});

		it('Will pass if the two normalized responses are the same', function(done){
			const check = setup(['hip 1234', 'hip dddd'], config[1]);
			check.start();
			setImmediate(function(){
				sinon.assert.called(mockFetch);
				expect(check.getStatus().ok).to.be.true;
				check.stop();
				done();
			});
		});

		it('Will fail if the two normalized responses are different', function(done){
			const check = setup(['hip rahh', 'hip dddd'], config[1]);
			check.start();
			setImmediate(function(){
				sinon.assert.called(mockFetch);
				expect(check.getStatus().ok).to.be.false;
				check.stop();
				done();
			});
		});
	});

});
