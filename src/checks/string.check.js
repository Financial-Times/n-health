'use strict';
const status = require('./status');
const FetchCheck = require('./fetchcheck');
const fetch = require('node-fetch');

class StringCheck extends FetchCheck {

	constructor(options){
		super(options);
		if (options.expected) {
				this.callback = (result) => {
					return result === options.expected;
				}
				this.checkResultInternal = this.checkResultInternal || {
					[status.PENDING]: `this test has not yet run`,
					[status.PASSED]: `${this.url} is equal to ${this.expected}`,
					[status.FAILED]: `${this.url} is not equal to ${this.expected}`,
				}
		}
	}

	_fetch() {
		return super._fetch.apply(this, arguments).then((response) => response.text());
	}

}

module.exports = StringCheck;
