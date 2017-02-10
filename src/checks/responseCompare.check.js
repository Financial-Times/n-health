'use strict';
const status = require('./status');
const Check = require('./check');
const fetch = require('node-fetch');

function allEqual(responses){
	for(let i = 1, l = responses.length; i < l; i++){
		if(responses[i] !== responses[0]){
			return false;
		}
	}

	return true;
}

class ResponseCompareCheck extends Check {

	constructor(options){
		super(options);
		this.comparison = options.comparison;
		this.urls = options.urls;
		this.headers = options.headers || {};
		this.normalizeResponse = options.normalizeResponse || (resp => resp);
	}

	get checkOutput(){
		if(this.status === status.PENDING){
			return 'this test has not yet run';
		}

		const urls = this.urls.join(' & ');
		if(this.comparison === ResponseCompareCheck.comparisons.EQUAL){
			return `${urls} are ${this.status === status.PASSED ? '' : 'not'} equal`;
		}
	}

	tick(){
		return Promise.all(this.urls.map(url => fetch(url, { headers: this.headers })))
			.then(responses => {
				return Promise.all(responses.map(r => r.text().then(this.normalizeResponse)));
			})
			.then(responses => {
				if(this.comparison === ResponseCompareCheck.comparisons.EQUAL){
					this.status = allEqual(responses) ? status.PASSED : status.FAILED;
				}
			})
			.catch(err => {
				console.error(err.stack);
				setTimeout(() => {throw err; }, 0);
			});
	}
}

ResponseCompareCheck.comparisons = {
	EQUAL : 'equal'
};

module.exports = ResponseCompareCheck;
