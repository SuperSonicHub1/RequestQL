const { inspect } = require("util")
const { graphql } = require('graphql')
const { schema, root } = require("./server.js")

const query = `
{
	request(url: "https://duckduckgo.com/") {
		html {
			select(selector: "div") {
				tag
				attribute(key: "href")
				has(selector: "p")
			}
		}
	}
}
`
// Run the GraphQL query '{ hello }' and print out the response
graphql(schema, query, root).then((response) => {
	console.log(
		inspect(response, { depth: null })
	)
});