'use strict';

const status = require('./status');
const Check = require('./check');

class AggregateCheck extends Check {
	constructor(options, parent) {
		super(options);
		this.watch = options.watch;
		this.mode = options.mode;
		this.parent = parent;
	}

	get checkOutput() {
		if (this.status === status.PENDING) {
			return 'This check has not yet run';
		}

		if (this.status === status.PASSED) {
			switch (this.mode) {
				case AggregateCheck.modes.AT_LEAST_ONE:
					return 'At least one of the checks is passing';
			}
		}

		if (this.status === status.FAILED) {
			switch (this.mode) {
				case AggregateCheck.modes.AT_LEAST_ONE:
					return 'None of the checks are passing';
			}
		}

		return undefined;
	}

	init() {
		let watchRegex = new RegExp(`(${this.watch.join('|')})`, 'i');
		this.obserables = this.parent.checks.filter((check) =>
			watchRegex.test(check.name)
		);
	}

	tick() {
		let results = this.obserables.map((c) => c.getStatus().ok);
		if (this.mode === AggregateCheck.modes.AT_LEAST_ONE) {
			this.status =
				results.length && results.some((r) => r)
					? status.PASSED
					: status.FAILED;
		}
	}
}

AggregateCheck.modes = {
	AT_LEAST_ONE: 'atLeastOne'
};

module.exports = AggregateCheck;
