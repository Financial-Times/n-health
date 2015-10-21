'use strict';
const status = require('./status');
const Check = require('./check');

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
		return fetch(this.url)
			.then(response => {
				if(!response.ok){
					throw new Error('BadResponse ' + response.status);
				}

				return response.json();
			})
			.then(json => {
				let result = this.callback(json);
				this.status = result ? status.PASSED : status.FAILED;
			})
			.catch(err => {
				console.error('Failed to get JSON', err);
				this.status = status.FAILED;
			})
	}
}

module.exports = JsonCheck;

