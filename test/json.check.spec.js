'use strict';

const assert = require('node:assert/strict');
const sinon = require('sinon');
const config = require('./fixtures/config/jsonCheckFixture').checks[0];
const proxyquire = require('proxyquire').noCallThru().noPreserveCache();

describe('JSON Checker', function () {
	let JsonCheck;
	let mockFetch;

	function setup(status, body) {
		mockFetch = sinon.stub().returns(
			Promise.resolve({
				status: 200,
				ok: status < 300,
				json: () => Promise.resolve(body)
			})
		);
		JsonCheck = proxyquire('../src/checks/json.check', {
			'node-fetch': mockFetch
		});
		sinon.spy(config, 'callback');
		return new JsonCheck(config);
	}

	afterEach(function () {
		config.callback.restore();
	});

	it('Should poll a given url and run the function passed in the config for each response', function (done) {
		const check = setup(200, { propertyToCheck: true });
		check.start();
		setTimeout(function () {
			sinon.assert.calledWith(mockFetch, config.url, config.fetchOptions);
			sinon.assert.called(config.callback);
			done();
		});
	});

	it('Should be ok if the callback function returns true', function (done) {
		const check = setup(200, { propertyToCheck: true });
		check.start();
		setTimeout(function () {
			sinon.assert.calledWith(mockFetch, config.url, config.fetchOptions);
			assert.equal(check.getStatus().ok, true);
			done();
		});
	});

	it('Should not be ok if the callback returns false', function (done) {
		const check = setup(200, { propertyToCheck: false });
		check.start();
		setTimeout(function () {
			sinon.assert.calledWith(mockFetch, config.url, config.fetchOptions);
			assert.equal(check.getStatus().ok, false);
			done();
		});
	});
});
