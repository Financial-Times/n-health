'use strict';

const expect = require('chai').expect;
const sinon = require('sinon');
const fetchMock = require('fetch-mock');


describe('JSON Checker', function(){

	let JsonCheck;
	let check;
	let config;

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
		config = require('./fixtures/config/jsonCheckFixture').checks[0];
		sinon.spy(config, 'callback');
		JsonCheck = require('../src/checks').json;
		check = new JsonCheck(config);
	}

	afterEach(function(){
		fetchMock.restore();
		config.callback.restore();
	});


	it('Should poll a given url and run the function passed in the config for each response', function(done){
		setup(200, {propertyToCheck:true});
		check.start();
		setTimeout(function(){
			expect(fetchMock.called('json')).to.be.true;
			sinon.assert.called(config.callback);
			done();
		});
	});

	it('Should be ok if the callback function returns true', function(done){
		setup(200, {propertyToCheck:true});
		check.start();
		setTimeout(function(){
			expect(fetchMock.called('json')).to.be.true;
			expect(check.getStatus().ok).to.be.true;
			done();
		});
	});

	it('Should not be ok if the callback returns false', function(done){
		setup(200, {propertyToCheck:false});
		check.start();
		setTimeout(function(){
			expect(fetchMock.called('json')).to.be.true;
			expect(check.getStatus().ok).to.be.false;
			done();
		});
	});
});
