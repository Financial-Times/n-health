module.exports = {
	name: 'paywall-fixture',
	description: ' ',
	checks: [
		{
			type: 'graphiteThreshold',
			name: 'test',
			severity: 2,
			metric: 'next.fake.metric',
			businessImpact: 'blah',
			technicalSummary: 'god knows',
			panicGuide: 'Don\'t Panic',
			interval: '1s'
		}
	]
};
