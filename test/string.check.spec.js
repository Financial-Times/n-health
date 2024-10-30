'use strict';

const assert = require('node:assert/strict');
const sinon = require('sinon');
const config = require('./fixtures/config/stringCheckFixture').checks[0];
const proxyquire = require('proxyquire').noCallThru().noPreserveCache();

describe('String Checker', function () {
	let StringCheck;
	let mockFetch;

	function setup(status, body) {
		mockFetch = sinon.stub().returns(
			Promise.resolve({
				status: 200,
				ok: status < 300,
				text: () => Promise.resolve(body)
			})
		);
		StringCheck = proxyquire('../src/checks/string.check', {
			'node-fetch': mockFetch
		});
		return new StringCheck(config);
	}

	it('Should be ok if the url returns the expected value', function (done) {
		const check = setup(200, 'OK');
		check.start();
		setTimeout(function () {
			sinon.assert.calledWith(mockFetch, config.url);
			sinon.assert.calledWith(mockFetch, config.url, config.fetchOptions);
			assert.equal(check.getStatus().ok, true);
			done();
		});
	});

	it('Should not be ok if the url does not return the expected value', function (done) {
		const check = setup(200, 'NOT OK');
		check.start();
		setTimeout(function () {
			sinon.assert.calledWith(mockFetch, config.url);
			sinon.assert.calledWith(mockFetch, config.url, config.fetchOptions);
			assert.equal(check.getStatus().ok, false);
			done();
		});
	});
});
