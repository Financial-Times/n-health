'use strict';
module.exports = {
	name: 'memory check fixture',
	description: '',
	checks: [
		{
			type: 'memory',
			name: 'test1',
			severity: 3,
			apps: 'all',
			businessImpact: 'blah',
			technicalSummary: 'god knows',
			panicGuide: 'Don\'t Panic',
			interval: '1m',
			window: '10m',
			threshold: 1
		}
	]
};
