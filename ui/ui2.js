const nodesById = new Map()
const linksByConnection = new Map()

// var colors = d3.scaleOrdinal(d3.schemeCategory10)
const colors = {
	START: "#f03",
	object: "#ff33cf",
	string: "#ff8600",
	number: "#0f3",
	boolean: "#aaa",
}

var graph = {
	links: [],
	nodes: [],
}
var svg = d3.select("svg"),
	width = +svg.attr("width"),
	height = +svg.attr("height"),
	node,
	link

svg
	.append("defs")
	.append("marker")
	.attrs({
		id: "arrowhead",
		viewBox: "-0 -5 10 10",
		refX: 13,
		refY: 0,
		orient: "auto",
		markerWidth: 13,
		markerHeight: 13,
		xoverflow: "visible",
	})
	.append("svg:path")
	.attr("d", "M 0,-5 L 10 ,0 L 0,5")
	.attr("fill", "#999")
	.style("stroke", "none")

var simulation = d3
	.forceSimulation()
	.force(
		"link",
		d3
			.forceLink()
			.id(function (d) {
				return d.d3nodeId
			})
			.distance(100)
			.strength(1)
	)
	.force("charge", d3.forceManyBody())
	.force("center", d3.forceCenter(width / 2, height / 2))

function restart() {
	// const { links, nodes } = graph
	// const nodeIndexByNodeId = {}
	// const nodesByNodeId = {}
	const nodes = Array.from(nodesById).map(([id, node]) => node)
	const links = Array.from(linksByConnection).map(([id, link]) => link)

	console.log(`nodes`, nodes)
	console.log(`links`, links)
	link = svg
		.selectAll(".link")
		.data(links)
		.enter()
		.append("line")
		.attr("class", "link")
		.attr("marker-end", "url(#arrowhead)")

	link.append("title").text(function (d) {
		return d.type
	})

	edgepaths = svg
		.selectAll(".edgepath")
		.data(links)
		.enter()
		.append("path")
		.attrs({
			class: "edgepath",
			"fill-opacity": 0,
			"stroke-opacity": 0,
			id: function (d, i) {
				return "edgepath" + i
			},
		})
		.style("pointer-events", "none")

	edgelabels = svg
		.selectAll(".edgelabel")
		.data(links)
		.enter()
		.append("text")
		.style("pointer-events", "none")
		.attrs({
			class: "edgelabel",
			id: function (d, i) {
				return "edgelabel" + i
			},
			"font-size": 10,
			fill: "#aaa",
		})

	edgelabels
		.append("textPath")
		.attr("xlink:href", function (d, i) {
			return "#edgepath" + i
		})
		.style("text-anchor", "middle")
		.style("pointer-events", "none")
		.attr("startOffset", "50%")
		.text(function (d) {
			return d.type
		})

	
	node = svg
		.selectAll(".node")
		.data(nodes)
		.enter()
		.append("g")
		.attr("class", "node")
		.call(
			d3.drag().on("start", dragstarted).on("drag", dragged)
			//.on("end", dragended)
		)

	node
		.append("circle")
		.attr("r", function (d) {
			return d.type === "START" ? 12 : 5
		})
		.style("fill", function (d, i) {
			console.log(`d`, d.key, colors[d.key])
			// return colors(i)
			return d.type === "START" ? colors["START"] : colors[d.key] || "#00f"
		})
		.on("click", async (circle) => {
			const nodeId = circle.value["#"]
			console.log(`clicked`, nodeId, circle)
			addChildren(nodeId)
			// await addSubNodes(nodeId)
			// restart()
		})

	// node.append("title").text(function (d) {
	// 	return d.id
	// })

	node
		.append("text")
		.attr("dy", 8)
		.attr("dx", 8)
		.html(function (d) {
			return `${d.name}`
		})
	node
		.append("text")
		.attr("dy", 20)
		.attr("dx", 8)
		.style("fill", "#0006")
		.style("font-size", "8px")
		.html(function (d) {
			return `${d.key}`
		})

	simulation.nodes(nodes).on("tick", ticked)
	simulation.force("link").links(links)

}

function ticked() {
	link
		.attr("x1", function (d) {
			return d.source.x
		})
		.attr("y1", function (d) {
			return d.source.y
		})
		.attr("x2", function (d) {
			return d.target.x
		})
		.attr("y2", function (d) {
			return d.target.y
		})

	node.attr("transform", function (d) {
		return "translate(" + d.x + ", " + d.y + ")"
	})

	edgepaths.attr("d", function (d) {
		return (
			"M " +
			d.source.x +
			" " +
			d.source.y +
			" L " +
			d.target.x +
			" " +
			d.target.y
		)
	})

	edgelabels.attr("transform", function (d) {
		if (d.target.x < d.source.x) {
			var bbox = this.getBBox()

			rx = bbox.x + bbox.width / 2
			ry = bbox.y + bbox.height / 2
			return "rotate(180 " + rx + " " + ry + ")"
		} else {
			return "rotate(0)"
		}
	})
}

function dragstarted(d) {
	if (!d3.event.active) simulation.alphaTarget(0.3).restart()
	d.fx = d.x
	d.fy = d.y
}

function dragged(d) {
	d.fx = d3.event.x
	d.fy = d3.event.y
}

//    function dragended(d) {
//        if (!d3.event.active) simulation.alphaTarget(0);
//        d.fx = undefined;
//        d.fy = undefined;
//    }

// Connect to as many peers as you want
const gun = Gun({ peers: [location.href + "gun"] })
// const entryId = prompt("Entry-id")
// const startId = "eins"

let fireRestartTimeout
function fireRestart() {
	clearTimeout(fireRestartTimeout)
	fireRestartTimeout = setTimeout(() => {
		console.log(`restart!`)
		restart()
	}, 100)
}

async function exploreNode(parentId) {
	return new Promise((resolveNodeId) => {
		gun.get(parentId).once(
			async (parent) => {
				if (!parent) return
				const d3ParentNodeId = parentId //String.fromCharCode(64 + ++nodecountindex) //parentId.replace(/\//g, ':') //String.fromCharCode(64 + ++nodecountindex)
				const d3ParentNode = { id: d3ParentNodeId, value: parent }
				console.log(`add ${d3ParentNodeId}`)
				nodesById.set(d3ParentNodeId, d3ParentNode)
				for (key in parent) {
					if (key === "_") continue
					const child = parent[key]
					console.log(`parent[${key}]`, child)

					if (child["#"]) {
						const childId = child["#"]
						const d3ChildNodeId = await exploreNode(childId)
						// const d3ChildNodeId = String.fromCharCode(64 + ++nodecountindex) //childId.replace(/\//g, ':') //String.fromCharCode(64 + ++nodecountindex)
						// const d3ChildNode = { id: d3ChildNodeId }
						const connectionId = `${d3ParentNodeId}-${d3ChildNodeId}`
						console.log(`add link ${connectionId}`)
						linksByConnection.set(connectionId, {
							source: nodesById.get(d3ParentNodeId),
							target: nodesById.get(d3ChildNodeId),
						})
					}
				}
				fireRestart()
				resolveNodeId(d3ParentNodeId)
			},
			{ wait: 100 }
		)
	})
}
exploreNode("julian")