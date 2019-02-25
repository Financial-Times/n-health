'use strict';
const status = require('./status');
const Check = require('./check');
const fetch = require('node-fetch');
const fetchres = require('fetchres');

class JsonCheck extends Check{

	constructor(options) {
		super(options);
		this.callback = options.callback;
		this.url = options.url;
		this.checkResultInternal = options.checkResult;
		this.fetchOptions = options.fetchOptions;
	}

	get checkOutput() {
		return this.checkResultInternal[this.status];
	}

	async tick() {
		try {
			const json = await fetch(this.url, this.fetchOptions).then(fetchres.json)

			let result = this.callback(json);
			this.status = result ? status.PASSED : status.FAILED;
		} catch(err) {
			console.error('Failed to get JSON', err);
			this.status = status.FAILED;
		}
	}
}

module.exports = JsonCheck;

