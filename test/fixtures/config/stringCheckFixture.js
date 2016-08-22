'use strict';
module.exports = {
	name: 'string check fixture',
	description: '',
	checks: [
		{
			type: 'string',
			name: 'test1',
			url: 'http://pretendurl.com',
			expected: 'OK',
			severity: 2,
			businessImpact: 'blah',
			technicalSummary: 'god knows',
			panicGuide: 'Don\'t Panic',
			checkResult: {
				PASSED: 'Text if check passed',
				FAILED: 'Text is check failed',
				PENDING: 'This check has not yet run'
			},
			interval: '1s',
            fetchOptions: {
                headers: {
                    ApiKey: "ApiKey"
                }
            }
		}
	]
};
