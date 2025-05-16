export function measurePerformance(renderFunctions: Array<() => void>) {
	const observer = new PerformanceObserver((list) => {
		list.getEntries().forEach((entry) => {
			console.log(`Type: ${entry.entryType}, Name: ${entry.name}, Duration: ${entry.duration}`)
		})
	})

	const mutationObserver = new MutationObserver((mutationsList) => {
		let addedNodesCount = 0
		let removedNodesCount = 0

		mutationsList.forEach((mutation) => {
			addedNodesCount += mutation.addedNodes.length
			removedNodesCount += mutation.removedNodes.length
			//console.log(`Mutation detected: ${mutation.type}`)
			//console.log(`Added nodes:`, mutation.addedNodes)
			//console.log(`Removed nodes:`, mutation.removedNodes)
		})

		console.log(`Added nodes: ${addedNodesCount}`)
		console.log(`Removed nodes: ${removedNodesCount}`)
	})

	mutationObserver.observe(document.body, {
		childList: true,
		subtree: true
	})

	observer.observe({ entryTypes: ["measure", "paint", "mark"] })

	performance.mark("start-rendering")

	renderFunctions.forEach(renderFunction => {
		console.log(`Executing function: ${renderFunction.name}`)
		renderFunction()
	})

	performance.mark("end-rendering")
	performance.measure("rendering", "start-rendering", "end-rendering")

	setTimeout(() => {
		observer.disconnect()
		mutationObserver.disconnect()
	}, 1000)
}
