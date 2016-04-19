'use strict';
module.exports = {
	name: 'memory check fixture',
	description: '',
	checks: [
		{
			type: 'memcheck',
			name: 'test1',
			severity: 3,
			businessImpact: 'blah',
			technicalSummary: 'god knows',
			panicGuide: 'Don\'t Panic',
			interval: '10m'
		}
	]
};
