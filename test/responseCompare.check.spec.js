'use strict';

const expect = require('chai').expect;
const sinon = require('sinon');
const proxyquire = require('proxyquire').noCallThru().noPreserveCache();
const config = require('./fixtures/config/responseCompareFixture').checks[0];

describe('Response Compare Check', function(){


	let ResponseCompareCheck, mockFetch;

	function setup (bodies) {
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
			const check = setup(['hip', 'hip']);
			check.start();
			setImmediate(function(){
				sinon.assert.called(mockFetch);
				expect(check.getStatus().ok).to.be.true;
				done();
			});
		});

		it('Will fail if the 2 responses are different', function(done){
			const check = setup(['hur', 'rah']);
			check.start();
			setImmediate(function(){
				sinon.assert.called(mockFetch);
				expect(check.getStatus().ok).to.be.false;
				done();
			});
		});
	})

});
