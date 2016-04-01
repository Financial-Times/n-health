'use strict';
module.exports = {
	name: 'graphite check fixture',
	description: '',
	checks: [
		{
			type: 'graphiteWorking',
			name: 'test1',
			key: 'next.fastly.133g5BGAc00Hv4v8t0dMry.asia.requests',
			severity: 2,
			businessImpact: 'blah',
			technicalSummary: 'god knows',
			panicGuide: 'Don\'t Panic',
			interval: '1s'
		}
	]
};
