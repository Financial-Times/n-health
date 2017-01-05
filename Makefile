include n.Makefile

.PHONY: test

test-unit:
	export HEROKU_AUTH_TOKEN=token; mocha

test-int:
	mocha int-tests/ -r loadvars.js

test: verify test-unit
