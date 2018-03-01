'use strict';
module.exports = {
	name: 'keen',
	descriptions : '',
	checks : [
		{
			type: 'keenSpike',
			query: 'page:view->count()',
			name: 'Some keen value is twice as low as last week',
			severity: 2,
			threshold: 2,
			businessImpact: 'catastrophic',
			technicalSummary: 'god knows',
			panicGuide: 'Don\'t Panic'
		}
	]
};
