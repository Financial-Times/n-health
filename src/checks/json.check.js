'use strict';
const FetchCheck = require('./fetchcheck');

class JsonCheck extends FetchCheck{

	_fetch() {
		return super._fetch.apply(this, arguments).then((response) => response.json());
	}

}

module.exports = JsonCheck;
