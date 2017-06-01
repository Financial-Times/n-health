node_modules/@financial-times/n-gage/index.mk:
	npm install @financial-times/n-gage
	touch $@

-include node_modules/@financial-times/n-gage/index.mk

.PHONY: test

test-unit:
	FT_GRAPHITE_KEY=123 HEROKU_AUTH_TOKEN=token mocha

test-int:
	mocha int-tests/ -r loadvars.js

test: verify test-unit
