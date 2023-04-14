'use strict';

class HealthChecks {
	constructor(config, healthchecks) {
		this.name = config.name;
		this.description = config.description;
		this.checks = config.checks.map((check) => {
			if (!(check.type in healthchecks)) {
				throw new Error(
					`Attempted to create check '${check.name}' of type ${check.type} which does not exist`
				);
			}

			return new healthchecks[check.type](check, this);
		});
	}

	start() {
		this.checks.forEach((check) => check.start());
	}

	stop() {
		this.checks.forEach((check) => check.stop());
	}

	getStatus() {
		let status = {
			schemaVersion: 1,
			name: this.name,
			description: this.description
		};
		status.checks = this.checks.map((check) => check.getStatus());
		return status;
	}
}

module.exports = HealthChecks;
