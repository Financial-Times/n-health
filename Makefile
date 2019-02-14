node_modules/@financial-times/n-gage/index.mk:
	npm install @financial-times/n-gage
	touch $@

-include node_modules/@financial-times/n-gage/index.mk

IGNORE_A11Y = true

.PHONY: test

test-unit:
	FT_GRAPHITE_KEY=123 HEROKU_AUTH_TOKEN=token mocha

test: verify test-unit
