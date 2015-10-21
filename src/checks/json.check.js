'use strict';
const status = require('./status');
const Check = require('./check');
require('promise.prototype.finally');

class JsonCheck extends Check{

	constructor(options){
		super(options);
		this.callback = options.callback;
		this.url = options.url;
		this.checkResultInternal = options.checkResult;
	}

	get checkOutput(){
		return this.checkResultInternal[this.status];
	}

	tick(){
		let check = this;
		return fetch(this.url)
			.then(function(response){
				if(!response.ok){
					throw new Error('BadResponse ' + response.status);
				}

				return response.json();
			})
			.then(function(json){
				let result = check.callback(json);
				check.status = result ? status.PASSED : status.FAILED;
			})
			.catch(function(err){
				console.error('Failed to get JSON', err);
				check.status = status.FAILED;
			})
	}
}

module.exports = JsonCheck;

