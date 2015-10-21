'use strict';

const status = require('./status');
const Check = require('./check');

class AggregateCheck extends Check {

	constructor(options, parent){
		super(options);
		this.watch = options.watch;
		this.mode = options.mode;
		this.parent = parent;
	}

	get checkOutput(){
		if(this.status === status.PENDING){
			return 'This check has not yet run';
		}

		if(this.status === status.PASSED){
			switch(this.mode){
				case AggregateCheck.modes.AT_LEAST_ONE :
					return 'At least one of the checks is passing';
			}
		}

		if(this.status === status.FAILED){
			switch(this.mode){
				case AggregateCheck.modes.AT_LEAST_ONE :
					return 'None of the checks are passing';
			}
		}
	}

	start(){
		let watchRegex = new RegExp(`(${this.watch.join('|')})`, 'i');
		this.obserables = this.parent.checks.filter(check => watchRegex.test(check.name));
		this.int = setInterval(this.tick.bind(this), this.interval);
		this.tick();
	}

	tick(){
		let results = this.obserables.map(c => c.getStatus().ok);
		if(this.mode === AggregateCheck.modes.AT_LEAST_ONE){
			this.status = results.length && results.some(r => r) ? status.PASSED : status.FAILED;
		}
		return Promise.resolve();
	}
}

AggregateCheck.modes = {
	AT_LEAST_ONE : 'atLeastOne'
};

module.exports = AggregateCheck;

