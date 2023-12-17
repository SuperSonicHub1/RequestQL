const { readFileSync } = require('fs')
const { buildSchema } = require('graphql')
const cheerio = require('cheerio')
require('isomorphic-fetch')

const schemaSource = readFileSync("schema.graphql", { encoding: "utf8" })
const schema = buildSchema(schemaSource);

const isNull = o => o === null || o === undefined
const toJSONValue = v => new JSONValue(v)

class JSONObject {
	constructor(object) {
		this.object = object
	}

	entry({key}) {
		return toJSONValue(this.object[key])
	}
}

class JSONValue {
	constructor(value) {
		this.value = value
	}

	string() {
		return isNull(this.value) ? null : new String(this.value)
	}

	number() {
		return isNull(this.value) ? null : new Number(this.value)
	}

	boolean() {
		return isNull(this.value) ? null : new Boolean(this.value)
	}

	object() {
		return isNull(this.value) ? null : new JSONObject(this.value)
	}

	array() {
		return isNull(this.value) ? null : Array.from(this.value).map(toJSONValue)
	}
}

class Node {
	constructor($) {
		this.$ = $
		this.zero = this.$[0]
	}

	select({ selector }) {
		const $ = this.$(selector).first()
		return $.length ? new Node($) : null
	}


	selectAll({ selector }) {
		return Array.from(this.$(selector))
			.map(e => cheerio.load(e))
			.map(e => new Node(e))
	}

	tag() {
		return this.zero.tagName
	}

	text() {
		return this.$.text()
	}

	html() {
		return this.$.html()
	}

	attribute({ key }) {
		return this.$.attr(key)
	}

	attributes() {
		return Array.from(
				Object.entries(this.$.attr())
			).map(keyValueTupleToObject)
	}

	has({ selector }) {
		return new Boolean(this.$.has(selector).length)
	}

	// children() {
	// 	return Array.from(this.$.children())
	// 		.map(e => cheerio.load(e))
	// 		.map(e => new Node(e))
	// }
}

function keyValueInputsToObject(headers) {
	const newHeaders = {}
	for (const { key, value } of headers)
		newHeaders[key] = value
	return newHeaders
}

function keyValueTupleToObject([key, value]) {
	return { key, value }
}

class Response {
	constructor(res) {
		this.res = res
	}

	statusCode() {
		return this.res.status
	}

	headers() {
		return Array.from(this.res.headers).map(keyValueTupleToObject)
	}

	async text() {
		return await this.res.text()
	}

	async json() {
		return toJSONValue(await this.res.json())
	}

	async html() {
		const $ = cheerio.load(await this.text())
		return $.length ? new Node($) : null
	}
}

const root = {
	request: async ({ url, method, headers }) => {
		const res = await fetch(url, { method, headers: keyValueInputsToObject(headers) })
		return new Response(res)
	},
}

module.exports = {
	schema,
	root
}
