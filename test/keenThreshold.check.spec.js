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

	Check = proxyquire('../src/checks/keenThreshold.check', {'keen-query': mockKeenQuery});
}

describe('Keen Threshold Check', function(){

	let check;

	afterEach(function(){
		check.stop();
	});

	context('Upper threshold enforced', function () {

		it('Should be healthy if result above upper threshold', function (done) {
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
				expect(mockKeenQuery.relTime.firstCall.args[0]).to.contain('this_60_minutes');
				expect(check.getStatus().ok).to.be.true;
				done();
			});
		});


		it('should be unhealthy if result is below upper threshold', done => {
			mockKeen({
				rows: [
					['something', 10]
				]
			});
			check = new Check(getCheckConfig({
				threshold: 11
			}));
			check.start();
			setTimeout(() => {
				expect(check.getStatus().ok).to.be.false;
				done();
			});
		});

	});

	context('Lower threshold enforced', function () {

		it('Should be healthy if all datapoints are above lower threshold', function (done) {
			mockKeen({
				rows: [
					['something', 10]
				]
			});
			check = new Check(getCheckConfig({
				threshold: 5,
				direction: 'below'
			}));
			check.start();
			setTimeout(() => {
				expect(check.getStatus().ok).to.be.true;
				done();
			});
		});

		it('Should be healthy if any datapoints are equal to lower threshold', function (done) {
			mockKeen({
				rows: [
					['something', 10]
				]
			});
			check = new Check(getCheckConfig({
				threshold: 10,
				direction: 'below'
			}));
			check.start();
			setTimeout(() => {
				expect(check.getStatus().ok).to.be.true;
				done();
			});
		});

		it('should be unhealthy if any datapoints are below lower threshold', done => {
			mockKeen({
				rows: [
					['something', 5]
				]
			});
			check = new Check(getCheckConfig({
				threshold: 10,
				direction: 'below'
			}));
			check.start();
			setTimeout(() => {
				expect(check.getStatus().ok).to.be.false;
				done();
			});
		});

	});

	it('Should be possible to configure sample period', function(done){
		mockKeen();
		check = new Check(getCheckConfig({
			timeframe: 'this_2_days'
		}));
		check.start();
		setTimeout(() => {
			expect(mockKeenQuery.build.firstCall.args[0]).to.contain('page:view->count()');
			expect(mockKeenQuery.relTime.firstCall.args[0]).to.contain('this_2_days');
			done();
		});
	});

});
