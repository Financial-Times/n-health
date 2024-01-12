'use strict';
const status = require('./status');
const Check = require('./check');
const fetch = require('node-fetch');
const fetchres = require('fetchres');
const logger = require('@dotcom-reliability-kit/logger');

class StringCheck extends Check {
	constructor(options) {
		super(options);
		this.expected = options.expected;
		this.url = options.url;
		this.fetchOptions = options.fetchOptions;
	}

	get checkOutput() {
		if (this.status === status.PENDING) {
			return 'this test has not yet run';
		}

		return `${this.url} is ${
			this.status === status.PASSED ? '' : 'not'
		} equal to ${this.expected}`;
	}

	async tick() {
		try {
			const body = await fetch(this.url, this.fetchOptions).then(fetchres.text);
			this.status = body === this.expected ? status.PASSED : status.FAILED;
		} catch (error) {
			logger.error(
				{
					event: 'STRING_CHECK_ERROR',
					message: 'Response was not OK'
				},
				error
			);
			this.status = status.FAILED;
		}
	}
}

module.exports = StringCheck;
