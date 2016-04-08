'use strict';
module.exports = {
	name: 'graphite check fixture',
	description: '',
	checks: [
		{
			type: 'graphiteWorking',
			name: 'test1',
			key: 'fastly.f8585BOxnGQDMbnkJoM1e.all.requests',
			severity: 2,
			businessImpact: 'blah',
			technicalSummary: 'god knows',
			panicGuide: 'Don\'t Panic',
			interval: '1s'
		}
	]
};
