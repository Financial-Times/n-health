'use strict';
const status = require('./status');

class Check {

	constructor({
		name,
		severity,
		businessImpact,
		technicalSummary,
		panicGuide
		}
	){
		this.name = name;
		this.severity = severity;
		this.businessImpact = businessImpact;
		this.technicalSummary = technicalSummary;
		this.panicGuide = panicGuide;
		this.status = status.PENDING;
		this.lastUpdated = null;
	}

	getStatus(){
		var output = {
			name: this.name,
			ok: this.status === status.PASSED,
			severity: this.severity,
			businessImpact: this.businessImpact,
			technicalSummary: this.technicalSummary,
			panicGuide: this.panicGuide,
			checkOutput: this.checkOutput
		};
		if (this.lastUpdated) {
			output.lastUpdated = this.lastUpdated.toISOString();
			let shouldHaveRun = Date.now() - (this.interval + 1000);
			if(this.lastUpdated.getTime() < shouldHaveRun){
				output.ok = false;
				output.checkOutput = 'Check has not run recently';
			}
		}
		return output;
	}
}

module.exports = Check;
