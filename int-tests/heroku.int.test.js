'use strict';
const expect = require('chai').expect;
const sinon = require('sinon');
const proxyquire = require('proxyquire').noCallThru().noPreserveCache();

describe('Heroku Adaptor', function(){

	const wait = ms => new Promise(r => setTimeout(r, ms));
	let adaptor;

	before(() => {
		adaptor = require('../src/lib/herokuAdaptor');
	});

	it('Should be able to get data from the metrics api', () => {
		return adaptor.getErrorMetrics('ft-next-article-eu', '10m')
			.then(metrics => {
				expect(metrics).to.exist;
				expect(metrics).to.have.property('start_time');
				expect(metrics).to.have.property('end_time');
				expect(metrics).to.have.property('step');
				expect(metrics).to.have.property('data');
			})
	});
});
