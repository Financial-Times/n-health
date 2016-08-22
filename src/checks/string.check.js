'use strict';
const status = require('./status');
const Check = require('./check');
const fetch = require('node-fetch');

class StringCheck extends Check {

	constructor(options){
		super(options);
		this.expected = options.expected;
		this.url = options.url;
		this.fetchOptions = options.fetchOptions;
	}

	get checkOutput(){
		if(this.status === status.PENDING){
			return 'this test has not yet run';
		}

		return `${this.url} is ${this.status === status.PASSED ? '' : 'not'} equal to ${this.expected}`;
	}

	tick(){
		return fetch(this.url, this.fetchOptions)
			.then(response => {
				if(!response.ok){
					throw new Error('BadResponse ' + response.status);
				}
				return response.text()
			})
			.then(body => this.status = body === this.expected ? status.PASSED : status.FAILED)
			.catch(err => {
				console.error('Response was not OK', err);
				this.status = status.FAILED;
			});
	}
}

module.exports = StringCheck;