'use strict';

if(process.env.NODE_ENV !== 'production' && process.env.NODE_ENV !== 'branch' && !process.env.CI && !process.env.JENKINS_URL){
	require('dotenv').load();
}
