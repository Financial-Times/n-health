'use strict';

class HealthChecks {

	constructor(config, healthchecks){
		this.name = config.name;
		this.description = config.description;
		this.checks = config.checks.map(check => {
			if(!healthchecks[check.type]){
				throw new Error(`Can not find check type ${check.type}`);
			}
			return new healthchecks[check.type](check, this)
		});
	}

	start(){
		this.checks.forEach(check => check.start());
	}

	stop(){
		this.checks.forEach(check => check.stop());
	}

	getStatus(){
		var status = {
			schemaVersion: 1,
			name: this.name,
			description: this.description
		};
		status.checks = this.checks.map(check => check.getStatus());
		return status;
	}
}

module.exports = HealthChecks;
