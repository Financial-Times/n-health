'use strict';
const status = require('./status');
const Check = require('./check');
const fetch = require('node-fetch');

class FetchCheck extends Check{

	constructor(options){
		super(options);
		this.callback = options.callback;
		this.url = options.url;
		this.checkResultInternal = options.checkResult;
		this.fetchOptions = options.fetchOptions;
	}

	get checkOutput(){
		return this.checkResultInternal[this.status];
	}

	_fetch() {
		return fetch(this.url, this.fetchOptions)
			.then(response => {
				if(!response.ok){
					throw new Error('BadResponse ' + response.status);
				}
				return response;
			})
	}

	tick(){
		return this._fetch()
			.then(response => {
				this.status = this.callback(response) ? status.PASSED : status.FAILED;
			})
			.catch(err => {
				console.error('Failed to get response', err);
				this.status = status.FAILED;
			})
	}
}

module.exports = FetchCheck;
