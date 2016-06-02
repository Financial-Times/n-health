include n.Makefile

.PHONY: test

test-unit:
	export HOSTEDGRAPHITE_READ_APIKEY=test-graph-key; export HEROKU_AUTH_TOKEN=token; mocha

test-int:
	mocha int-tests/ -r loadvars.js

test: verify test-unit
