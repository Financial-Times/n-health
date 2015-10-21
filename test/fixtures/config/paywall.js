module.exports = {
	name: 'paywall-fixture',
	description: ' ',
	checks: [
		{
			type: 'pingdom',
			name: 'test',
			checkID: '112345',
			severity: 2,
			businessImpact: 'blah',
			technicalSummary: 'god knows',
			panicGuide: 'Don\'t Panic',
			interval: '1s'
		}
	]
};
