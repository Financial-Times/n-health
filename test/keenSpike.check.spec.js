'use strict';

const expect = require('chai').expect;
const fixture = require('./fixtures/config/keenThresholdFixture').checks[0];
const proxyquire = require('proxyquire').noCallThru().noPreserveCache();
const sinon = require('sinon');

function getCheckConfig (conf) {
	return Object.assign({}, fixture, conf || {});
}

let mockKeenQuery;
let Check;


// Mocks a pair of calls to keen for sample and baseline data
function mockKeen (results) {

	mockKeenQuery = {
		setConfig: sinon.stub(),
		build: sinon.stub().returnsThis(),
		filter: sinon.stub().returnsThis(),
		relTime: sinon.stub().returnsThis(),
		print: sinon.stub().returns(Promise.resolve(results))
	};

	Check = proxyquire('../src/checks/keenSpike.check', {'keen-query': mockKeenQuery});
}

describe('Keen Threshold Check', function(){

	let check;

	afterEach(function(){
		check.stop();
	});

	it.only('Should be healthy if result above upper threshold', function (done) {
		mockKeen({
			rows: [
				['something', 100]
			]
		});
		check = new Check(getCheckConfig({
			threshold: 11
		}));
		check.start();
		setTimeout(() => {
			expect(mockKeenQuery.build.firstCall.args[0]).to.contain('page:view->count()');
			done();
		})

	})



});
