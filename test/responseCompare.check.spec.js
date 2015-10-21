'use strict';
require('babel/register');
const expect = require('chai').expect;
const fetchMock = require('fetch-mock');

describe('Response Compare Check', function(){

	let ResponseCompareCheck;
	let check;

	function setup (bodies) {

		fetchMock.mock({
			routes: [
				{
					name: 'compare',
					matcher: '^http://url',
					response: () => bodies.pop()
				}
			]
		});
		const config = require('./fixtures/config/responseCompareFixture').checks[0];
		ResponseCompareCheck = require('../src/checks').responseCompare;
		check = new ResponseCompareCheck(config);
	}

	afterEach(function(){
		fetchMock.restore();
	});

	describe('equal', function(){

		it('Will pass if the 2 responses are the same', function(done){
			setup(['hip', 'hip']);
			check.start();
			setTimeout(function(){
				expect(fetchMock.called('compare')).to.be.true;
				expect(check.getStatus().ok).to.be.true;
				done();
			});
		});

		it('Will fail if the 2 responses are different', function(done){
			setup(['hur', 'rah']);
			check.start();
			setTimeout(function(){
				expect(fetchMock.called('compare')).to.be.true;
				expect(check.getStatus().ok).to.be.false;
				done();
			});
		});
	})

});
