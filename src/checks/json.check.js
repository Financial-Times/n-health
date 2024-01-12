'use strict';
const status = require('./status');
const Check = require('./check');
const fetch = require('node-fetch');
const fetchres = require('fetchres');
const logger = require('@dotcom-reliability-kit/logger');

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
			const json = await fetch(this.url, this.fetchOptions).then(fetchres.json);

			let result = this.callback(json);
			this.status = result ? status.PASSED : status.FAILED;
		} catch(error) {
			logger.error({
				event: 'JSON_CHECK_ERROR',
				message: `Failed to fetch JSON from ${this.url}`
			}, error);
			this.status = status.FAILED;
		}
	}
}

module.exports = JsonCheck;

