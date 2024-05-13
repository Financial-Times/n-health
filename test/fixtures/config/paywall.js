module.exports = {
	name: 'paywall-fixture',
	description: ' ',
	checks: [
		{
			type: 'json',
			name: 'test',
			severity: 2,
			url: 'http://pretendurl.com',
			businessImpact: 'blah',
			technicalSummary: 'god knows',
			panicGuide: "Don't Panic",
			checkResult: {
				PASSED: 'Text if check passed',
				FAILED: 'Text is check failed',
				PENDING: 'This check has not yet run'
			},
			interval: '1s'
		}
	]
};
