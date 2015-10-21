'use strict';

const expect = require('chai').expect;
const sinon = require('sinon');
const fetchMock = require('fetch-mock');
const config = require('./fixtures/config/jsonCheckFixture').checks[0];
const JsonCheck = require('../src/checks').json;

describe('JSON Checker', function(){

	function setup(status, body){
		fetchMock.mock({
			routes: [
				{
					name: 'json',
					matcher: 'http://pretendurl.com',
					response: {
						status: status,
						body: body
					}
				}
			]
		});
		sinon.spy(config, 'callback');
		return new JsonCheck(config);
	}

	afterEach(function(){
		fetchMock.restore();
		config.callback.restore();
	});


	it('Should poll a given url and run the function passed in the config for each response', function(done){
		const check = setup(200, {propertyToCheck:true});
		check.start();
		setTimeout(function(){
			expect(fetchMock.called('json')).to.be.true;
			sinon.assert.called(config.callback);
			done();
		});
	});

	it('Should be ok if the callback function returns true', function(done){
		const check = setup(200, {propertyToCheck:true});
		check.start();
		setTimeout(function(){
			expect(fetchMock.called('json')).to.be.true;
			expect(check.getStatus().ok).to.be.true;
			done();
		});
	});

	it('Should not be ok if the callback returns false', function(done){
		const check = setup(200, {propertyToCheck:false});
		check.start();
		setTimeout(function(){
			expect(fetchMock.called('json')).to.be.true;
			expect(check.getStatus().ok).to.be.false;
			done();
		});
	});
});
