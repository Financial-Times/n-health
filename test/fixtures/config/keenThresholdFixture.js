'use strict';
module.exports = {
	name: 'keen',
	descriptions : '',
	checks : [
		{
			type: 'keenThreshold',
			query: 'page:view->count()',
			name: 'Some keen value is above some threshold',
			severity: 2,
			threshold: 4,
			businessImpact: 'catastrophic',
			technicalSummary: 'god knows',
			panicGuide: 'Don\'t Panic'
		}
	]
};
