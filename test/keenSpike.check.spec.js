'use strict';

const expect = require('chai').expect;
const fixture = require('./fixtures/config/keenSpikeFixture').checks[0];
const proxyquire = require('proxyquire').noCallThru().noPreserveCache();
const sinon = require('sinon');

function getCheckConfig (conf) {
	return Object.assign({}, fixture, conf || {});
}

let mockKeenQuery;
let Check;


// Mocks a pair of calls to keen for sample and baseline data
function mockKeen (results1, results2) {
	let print = sinon.stub();
	print.onFirstCall().returns(Promise.resolve(results1));
	print.onSecondCall().returns(Promise.resolve(results2));

	mockKeenQuery = {
		setConfig: sinon.stub(),
		build: sinon.stub().returnsThis(),
		filter: sinon.stub().returnsThis(),
		relTime: sinon.stub().returnsThis(),
		absTime: sinon.stub().returnsThis(),
		print: print
	};

	Check = proxyquire('../src/checks/keenSpike.check', {'keen-query': mockKeenQuery});
}

describe('Keen Spike Check', function(){

	let check;

	afterEach(function(){
		check.stop();
	});

	context('below', function () {

		it('Should be unhealthy when the sample data is > threshold% lower than the baseline data', function (done) {
			mockKeen({
				rows: [
					['sample', 100]
				]
			}, {
				rows: [
					['baseline', 200]
				]
			});
			check = new Check(getCheckConfig({
				threshold: 0.2,
				direction: 'below'
			}));
			check.start();
			setTimeout(() => {
				expect(check.getStatus().ok).to.be.false;
				done();
			});
		});

		it('Should be healthy when the sample data is < threshold% below the threshold of the baseline data', function (done) {
			mockKeen({
				rows: [
					['sample', 180]
				]
			}, {
				rows: [
					['baseline', 200]
				]
			});
			check = new Check(getCheckConfig({
				threshold: 0.5,
				direction: 'below'
			}));
			check.start();
			setTimeout(() => {
				expect(check.getStatus().ok).to.be.true;
				done();
			});
		});

	});

	context('above', function () {

		it('Should be unhealthy when the sample data is > threshold% above the threshold of the baseline data', function (done) {
			mockKeen({
				rows: [
					['sample', 200]
				]
			}, {
				rows: [
					['baseline', 50]
				]
			});
			check = new Check(getCheckConfig({
				threshold: 0.2,
				direction: 'above'
			}));
			check.start();
			setTimeout(() => {
				expect(check.getStatus().ok).to.be.false;
				done();
			});
		});

		it('Should be healthy when the sample data is < threshold% above the threshold of the baseline data', function (done) {
			mockKeen({
				rows: [
					['sample', 200]
				]
			}, {
				rows: [
					['baseline', 150]
				]
			});
			check = new Check(getCheckConfig({
				threshold: 0.5,
				direction: 'above'
			}));
			check.start();
			setTimeout(() => {
				expect(check.getStatus().ok).to.be.true;
				done();
			});
		});

	});

});
