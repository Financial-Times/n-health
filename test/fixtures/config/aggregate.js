'use strict';
module.exports = {
	name : 'aggregate check fixture',
	description : '',
	checks : [
		{
			"type": "pingdom",
			"name": "test1",
			"checkId": "5555",
			"severity": 2,
			"businessImpact" : "blah",
			"technicalSummary" : "god knows",
			"panicGuide" : "Don't Panic",
			"interval" : "1s"
		},
		{
			"type": "pingdom",
			"name": "test2",
			"checkId": "5656",
			"severity": 2,
			"businessImpact" : "blah",
			"technicalSummary" : "god knows",
			"panicGuide" : "Don't Panic",
			"interval" : "1s"
		},
		{
			type: "aggregate",
			severity: 3,
			name: "name",
			watch : ["test1", "test2"],
			mode : "atLeastOne",
			interval : "1s",
			"panicGuide" : "Don't Panic",
			"technicalSummary" : "god knows",
			"businessImpact" : "blah",
		}
	]
};
