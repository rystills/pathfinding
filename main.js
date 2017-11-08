/**
 * helper function for calculatePath/calculatePathWaypoints: compare two container objects' coordinates
 * @param other: the other object to check against
 */
function checkCoords(other) {
	return other.x == this.x && other.y == this.y;
}

/**
 * helper function for calculatePath/calculatePathWaypoints: calculate the manhattan distance between two spaces
 * @param space1: the first space whose coordinates we wish to check
 * @param space2: the second space whose coordinates we wish to check
 */
function manhattanDistance(space1,space2) {
	return Math.abs(space2.x-space1.x) + Math.abs(space2.y-space1.y);
}

/**
 * helper function for calculatePath/calculatePathWaypoints: calculate the total cost of the active heuristics when applied to the input space
 * @param desiredSpace: the space whose heuristic cost we wish to calculate
 * @param goalSpace: the space we wish to arrive at
 */
function calculateHeuristics(desiredSpace,goalSpace) {
	//heuristic 1: linear distance
	var weight1 = getDistance(desiredSpace.x,desiredSpace.y, goalSpace.x,goalSpace.y) * heuristic1Weight;
	var weight2 = manhattanDistance(desiredSpace,goalSpace) * heuristic2Weight;
	return weight1 + weight2;
}

/**
 * helper function for calculatePath/calculatePathWaypoints: composes the final path by tracing through space parents
 * @param startSpace: the starting space for the path
 * @param goalSpace: the goal space for the path
 * @returns an ordered list of spaces which form the final path
 */
function composePath(startSpace, goalSpace) {
	//path is kept global for visual representation
	path = [goalSpace];
	var curSpace = goalSpace;
	//iterate backwards from goalSpace to startSpace, adding each space to the final path list
	while (curSpace != startSpace) {
		curSpace = curSpace.parent;
		path.unshift(curSpace);
	}
	return path;
}

/**
 * calculate the shortest path in a terrain from one space to another, utilizing waypoints to speed up the search
 * @param terrain: the terrain in which to search for a path
 * @param waypoints: the waypoints to assist in our search for a path
 * @param startSpace: the space on which to begin the search
 * @param goalSpace: the desired goal space
 * @returns the shortest path from the start space to the goal space
 */
function calculatePathWaypoints(terrain,waypoints,startSpace,goalSpace) {
	/**
	 * helper method for calculatePathWaypoints: locate the closest waypoint to the specified container (essentially a bfs version of calculatePath)
	 * @param space: the container from which to locate the nearest waypoint
	 */
	function locateNearestWaypoint(space) {
		//base case: nothing more to do if we are already on a waypoint	
		if (containerIsWaypoint(space,waypoints)) {
			path = [space];
			return space;
		}
		
		//initialize goal and parent space properties
		goalSpace.parent = null;
		space.parent = null;
		space.startDistance = 0;
		
		//initialize open and closed sets for traversal
		closedSet = [];
		openSet = [space];
		
		//main iteration: keep popping spaces from the back until we have found a solution or openSet is empty (no path found)
		while (openSet.length > 0) {
			//grab another space from the open set and push it to the closed set
			var currentSpace = openSet.shift();
			closedSet.push(currentSpace);
			//gather a list of adjacent spaces
			var adjacentSpaces = adjacentContainers(terrain,currentSpace.x,currentSpace.y);
			
			//main inner iteration: check each space in adjacentSpaces for validity
			for (var k = 0; k < adjacentSpaces.length; ++k) {	
				var newSpace = adjacentSpaces[k];
				//if the new space is the goal, compose the path back to startSpace
				if (containerIsWaypoint(newSpace,waypoints)) {
					newSpace.parent = currentSpace;
					path = composePath(space,newSpace);
					return newSpace;
				}
				
				//add newSpace to the openSet if it isn't in the closedSet or if the new start distance is lower
				if (containerWalkable(terrain, newSpace.x,newSpace.y)) {				
					var newStartDistance = currentSpace.startDistance + 1;

					//if newSpace already exists in either the open set or the closed set, grab it now so we maintain startDistance
					var openSetIndex = openSet.findIndex(checkCoords,newSpace);
					var inOpenSet = openSetIndex!= -1;
					if (inOpenSet) {
						newSpace = openSet[openSetIndex];
					}
					var closedSetIndex = closedSet.findIndex(checkCoords,newSpace);
					var inClosedSet = closedSetIndex != -1;
					if (inClosedSet) {
						newSpace = closedSet[closedSetIndex];
					}
					
					//don't bother with newSpace if it has already been visited unless our new distance from the start space is smaller than its existing startDistance
					if (inClosedSet && (newSpace.startDistance <= newStartDistance)) {
						continue;
					}

					//accept newSpace if newSpace has not yet been visited or its new distance from the start space is less than its existing startDistance
					if ((!inOpenSet) || newSpace.startDistance > newStartDistance) { 
						newSpace.parent = currentSpace;
						newSpace.startDistance = newStartDistance;
						//remove newSpace from openSet, then add it back via binary search to ensure that its position in the open set is up to date
						if (inOpenSet) {
							openSet.splice(openSetIndex,1);
						}
						openSet.splice(binarySearch(openSet,newSpace,"totalCost",true),0,newSpace);
						//if newSpace is in the closed set, remove it now
						if (inClosedSet) {
							closedSet.splice(closedSetIndex,1);
						}
					}
					
				}
			}
		}
		//if we reach this point, then no waypoint was reachable from the specified container
		return null;
	}
	
	path = [];
	//if the start space is the goal space, then the path is just that space
	if (startSpace == goalSpace) {
		return [startSpace];
	}
	
	//grab the nearest waypoint to both the start space and the goal space
	startWaypoint = locateNearestWaypoint(startSpace);
	var startClosedSet = closedSet;
	var startPath = path;
	
	goalWaypoint = locateNearestWaypoint(goalSpace);
	//preserve the state of the closedSet and path so we can combine it all at the end for visual display of pathfinding process
	var waypointsClosedSet = closedSet.concat(startClosedSet);
	var waypointsPath = path.concat(startPath);
	
	 //if somehow no waypoint was reachable from either the start or goal node, there's nothing more we can do
	if (!(startWaypoint && goalWaypoint)) {
		return [];
	}
	
	//now that we have the start and goal waypoint containers, we can run a normal A* search on the waypoints
	//initialize goal and parent space properties
	goalWaypoint.parent = null;
	startWaypoint.parent = null;
	startWaypoint.startDistance = 0;
	
	//initialize open and closed sets for traversal (closed set is kept global for visual representation)
	closedSet = [];
	openSet = [startWaypoint];
	
	//main iteration: keep popping spaces from the back until we have found a solution or openSet is empty (no path found)
	while (openSet.length > 0) {
		//grab another space from the open set and push it to the closed set
		var currentSpace = openSet.shift();
		closedSet.push(currentSpace);
		
		//gather a list of adjacent spaces
		var adjacentSpaces = adjacentWaypoints(waypoints,currentSpace.x,currentSpace.y);
		
		//main inner iteration: check each space in adjacentSpaces for validity
		for (var k = 0; k < adjacentSpaces.length; ++k) {	
			var newSpace = adjacentSpaces[k];
			//if the new space is the goal, compose the path back to startWaypoint
			if (newSpace.x == goalWaypoint.x && newSpace.y == goalWaypoint.y) {
				goalWaypoint.parent = currentSpace; //start the path with currentSpace and work our way back
				closedSet = closedSet.concat(waypointsClosedSet);
				return composePath(startWaypoint, goalWaypoint).concat(waypointsPath);
			}
			
			//add newSpace to the openSet if it isn't in the closedSet or if the new start distance is lower
			if (containerWalkable(terrain, newSpace.x,newSpace.y)) {
				var newStartDistance = currentSpace.startDistance + 1;

				//if newSpace already exists in either the open set or the closed set, grab it now so we maintain startDistance
				var openSetIndex = openSet.findIndex(checkCoords,newSpace);
				var inOpenSet = openSetIndex!= -1;
				if (inOpenSet) {
					newSpace = openSet[openSetIndex];
				}
				var closedSetIndex = closedSet.findIndex(checkCoords,newSpace);
				var inClosedSet = closedSetIndex != -1;
				if (inClosedSet) {
					newSpace = closedSet[closedSetIndex];
				}
				
				//don't bother with newSpace if it has already been visited unless our new distance from the start space is smaller than its existing startDistance
				if (inClosedSet && (newSpace.startDistance <= newStartDistance)) {
					continue;
				}

				//accept newSpace if newSpace has not yet been visited or its new distance from the start space is less than its existing startDistance
				if ((!inOpenSet) || newSpace.startDistance > newStartDistance) { 
					newSpace.parent = currentSpace;
					newSpace.startDistance = newStartDistance;
					newSpace.totalCost = newSpace.startDistance + calculateHeuristics(newSpace,goalWaypoint);
					//remove newSpace from openSet, then add it back via binary search to ensure that its position in the open set is up to date
					if (inOpenSet) {
						openSet.splice(openSetIndex,1);
					}
					openSet.splice(binarySearch(openSet,newSpace,"totalCost",true),0,newSpace);
					//if newSpace is in the closed set, remove it now
					if (inClosedSet) {
						closedSet.splice(closedSetIndex,1);
					}
				}
				
			}
		}
	}
	closedSet = closedSet.concat(waypointsClosedSet);
	//no path was found; simply return an empty list
	return [];
}

/**
 * calculate the shortest path in a terrain from one space to another, utilizing only tiles
 * @param terrain: the terrain in which to search for a path
 * @param startSpace: the space on which to begin the search
 * @param goalSpace: the desired goal space
 * @param goalCondition: the condition for reaching the goal
 * @param useHeuristics: whether to utilize the current global heuristic settings (true) or simply do a bfs (false)
 * @returns the shortest path from the start space to the goal space
 */
function calculatePath(terrain,startSpace,goalSpace, goalCondition, useHeuristics) { 	
	//if the start space is the goal space, then the path is just that space
	if (goalCondition(startSpace,goalSpace)) {
		return [startSpace];
	}
	
	//initialize goal and parent space properties
	startSpace.parent = null;
	startSpace.startDistance = 0;
	
	//initialize open and closed sets for traversal (closed set is kept global for visual representation)
	closedSet = [];
	openSet = [startSpace];
	
	//main iteration: keep popping spaces from the back until we have found a solution or openSet is empty (no path found)
	while (openSet.length > 0) {
		//grab another space from the open set and push it to the closed set
		var currentSpace = openSet.shift();
		closedSet.push(currentSpace);
		
		//gather a list of adjacent spaces
		var adjacentSpaces = adjacentContainers(terrain,currentSpace.x,currentSpace.y);
		
		//main inner iteration: check each space in adjacentSpaces for validity
		for (var k = 0; k < adjacentSpaces.length; ++k) {	
			var newSpace = adjacentSpaces[k];
			//if the new space is the goal, compose the path back to startSpace
			if (goalCondition(newSpace,goalSpace)) {
				newSpace.parent = currentSpace; //start the path with currentSpace and work our way back
				return composePath(startSpace, newSpace);
			}
			
			//add newSpace to the openSet if it isn't in the closedSet or if the new start distance is lower
			if (containerWalkable(terrain, newSpace.x,newSpace.y)) {				
				var newStartDistance = currentSpace.startDistance + 1;

				//if newSpace already exists in either the open set or the closed set, grab it now so we maintain startDistance
				var openSetIndex = openSet.findIndex(checkCoords,newSpace);
				var inOpenSet = openSetIndex!= -1;
				if (inOpenSet) {
					newSpace = openSet[openSetIndex];
				}
				var closedSetIndex = closedSet.findIndex(checkCoords,newSpace);
				var inClosedSet = closedSetIndex != -1;
				if (inClosedSet) {
					newSpace = closedSet[closedSetIndex];
				}
				
				//don't bother with newSpace if it has already been visited unless our new distance from the start space is smaller than its existing startDistance
				if (inClosedSet && (newSpace.startDistance <= newStartDistance)) {
					continue;
				}

				//accept newSpace if newSpace has not yet been visited or its new distance from the start space is less than its existing startDistance
				if ((!inOpenSet) || newSpace.startDistance > newStartDistance) { 
					newSpace.parent = currentSpace;
					newSpace.startDistance = newStartDistance;
					newSpace.totalCost = newSpace.startDistance + (useHeuristics ? calculateHeuristics(newSpace,goalSpace) : 0);
					//remove newSpace from openSet, then add it back via binary search to ensure that its position in the open set is up to date
					if (inOpenSet) {
						openSet.splice(openSetIndex,1);
					}
					openSet.splice(binarySearch(openSet,newSpace,"totalCost",true),0,newSpace);
					//if newSpace is in the closed set, remove it now
					if (inClosedSet) {
						closedSet.splice(closedSetIndex,1);
					}
				}
				
			}
		}
	}
	//no path was found; simply return an empty list
	return [];
}

/**
 * clear the closedSet and path from the last pathfinding run
 */
function clearResults() {
	closedSet = [];
	openSet = [];
	path = [];
}

/**
 * locate the start and end blocks and then run calculatePath
 */
function findPath() {
	var startSpace = null;
	var goalSpace = null;
	for (var block in blocks) {
	    if (blocks.hasOwnProperty(block)) {
	    	//check if we found a start space
	    	if (blocks[block].type == blockTypes.start) {
	    		startSpace = blocks[block];
	    	}
	    	//check if we found a goal space
	    	else if (blocks[block].type == blockTypes.goal) {
	    		goalSpace = blocks[block];
	    	}
	    }
	}
	//calculate a path assuming we found a user-defined start and end space
	if (startSpace && goalSpace) {
		if (activeMode == modes.tile) {
			path = calculatePath(scripts[activeMap.name].map,startSpace,goalSpace);	
		}
		else {
			path = calculatePathWaypoints(scripts[activeMap.name].map,scripts[activeMap.name].waypoints,startSpace,goalSpace);
		}
	}
}

/**
 * clear each canvas to a predetermined fillcolor, preparing it for a fresh render
 */
function clearScreen() {
	ctx.fillStyle="rgb(22,19,58)";
	ctx.fillRect(0,0,cnv.width,cnv.height);
	
	uictx.fillStyle="rgb(0,0,0)";
	uictx.fillRect(0,0,uicnv.width,uicnv.height);
}

/**
 * main game loop; update all aspects of the game in-order
 */
function update() {
	//update the deltaTime
	updateTime();
	
	//update camera scrolling
	updateScroll();
		
	//check if the user triggered a zoom change
	checkChangeZoom();
	
	//update objects
	for (var i = 0; i < objects.length; ++i) {
		objects[i].update();
	}
	
	//update GUI elements
	for (var i = 0; i < buttons.length; ++i) {
		buttons[i].update();	
	}
	
	//once all updates are out of the way, render the frame
	render();
	
	//toggle off any one-frame event indicators at the end of the update tick
	mousePressedLeft = false;
	mousePressedRight = false;
}

/**
 * check if the user is attempting to change zoon levels
 */
function checkChangeZoom() {
	var prevTileSize = tileSize;
	if (keyStates['1']) {
		tileSize = 16;
	}
	else if (keyStates['2']) {
		tileSize = 8;
	}
	else if (keyStates['3']) {
		tileSize = 4;
	}
	//only re-render the map if the tile size was updated
	if (tileSize != prevTileSize) {
		renderMap();
	}
}

/**
 * Check whether or not the specified container is a waypoint
 * @param waypoints: list of waypoints to check in
 * @param container: the container to check for
 */
function containerIsWaypoint(container, waypoints) {
	return (waypoints.hasOwnProperty(container.x+","+container.y));
}

/**
 * add connections between all waypoints which lie directly on one axis from each other, with no obstacles in-between
 */
function connectWaypoints() {	
	/**
	 * helper method for connectWaypoints: find all waypoints from container moving in direction dir until a wall is hit
	 * @param container: the current container
	 * @param dir: the direction in which to travel
	 */
	function accumulateWaypoints(container,dir) {
		if (containerWalkable(scripts[mapName].map,container.x,container.y)) {
			if (containerIsWaypoint(container, scripts[mapName].waypoints)) {
				return [container];
			}
			try {
				return accumulateWaypoints(adjacentContainer(scripts[mapName].map,container.x,container.y,dir),dir);
			}
			catch(err) {
				//return immediately if no adjacent container exists
			}
		}
		return [];
	}
	
	var mapName = "arena2";
	var directionList = [directions.up,directions.left,directions.down,directions.right];
	for (var i = 0; i < 2; ++i) {
		for (var wp in scripts[mapName].waypoints) {
		    if (scripts[mapName].waypoints.hasOwnProperty(wp)) {
		    	var coords = wp.split(",");
		    	coords[0] = parseInt(coords[0],10);
		    	coords[1] = parseInt(coords[1],10);
				//populate array corresponding to waypoint x,y key with connections by branching out in all cardinal directions
				for (var j = 0; j < directionList.length; ++j) {
					try {
						scripts[mapName].waypoints[wp] = scripts[mapName].waypoints[wp].concat(
								accumulateWaypoints(adjacentContainer(scripts[mapName].map,coords[0],
										coords[1],directionList[j]),directionList[j]));
					}
					catch(err) {
						//simply proceed to the next direction if no adjacent container exists
					}
				}
		    }
		}
		mapName = "hrt201n";
	}
	
}

/**
 * render the entire map to a canvas at the desired zoom level
 */
function renderMap() {
	mapCnv.width = scripts[activeMap.name].map[0].length*tileSize;
	mapCnv.height = scripts[activeMap.name].map.length*tileSize;
	
	var map = scripts[activeMap.name].map;
	//first pass: draw tiles
	for (var i = 0; i < map.length; ++i) {
		for (var r = 0; r < map[i].length; ++r) {
			mapCtx.drawImage(images[imageKey[map[i][r]] + (tileSize == 16 ? "" : (tileSize == 8 ? " small" : " tiny"))],r*tileSize,i*tileSize);	
		}
	}
}

/**
 * change the current active block type that the user is placing
 */
function changeBlockType() {
	activeBlockType = (activeBlockType == blockTypes.obstacle ? blockTypes.start : (activeBlockType == blockTypes.start ? blockTypes.goal : blockTypes.obstacle));
	this.text = "Block Type: " + activeBlockType.name;
}

/**
 * toggle the max mouse distance at which to show containers between 200px and 10,000px 
 */
function changeMaxMouseDistance() {
	maxMouseDistance = (maxMouseDistance == 200 ? 10000 : 200);
	this.text = "Show Tiles: " + (maxMouseDistance == 200 ? "Near Mouse" : "Always");
}

/**
 * change to the next mode
 * @returns
 */
function changeMode() {
	activeMode = (activeMode == modes.tile ? modes.waypoint : modes.tile);
	this.text = "Representation: " + activeMode.name;
	clearResults();
}

/**
 * update the weight of the specified heuristic number
 * @param heuristicNum: the number of the heuristic whose weight we wish to change
 */
function changeHeuristicWeight(heuristicNum) {
	if (heuristicNum == 1) {
		heuristic1Weight = (heuristic1Weight + 1) % 5;
		this.text = "Linear Distance: " + heuristic1Weight + (heuristic1Weight == 0 ? "%" : "00%");
	}
	else if (heuristicNum == 2) {
		heuristic2Weight = (heuristic2Weight + 1) % 5;
		this.text = "Manhattan Distance: " + heuristic2Weight + (heuristic2Weight == 0 ? "%" : "00%");
	}
}

/**
 * delete all user-created blocks
 */
function clearBlocks() {
	blocks = {};
}

/**
 * change to the next map
 */
function changeMap() {
	activeMap = (activeMap == maps.arena2 ? maps.hrt201n : maps.arena2);
	renderMap();
	this.text = "Map: " + activeMap.name;
	clearBlocks();
	clearResults();
}

/**
 * update the camera scroll based on user input
 */
function updateScroll() {
	var scrollSpeed = 16/tileSize;
	//vertical scrolling
	if (keyStates["W"]) {
		scrollY -= tileSize*scrollSpeed;
	}
	else if (keyStates["S"]) {
		scrollY += tileSize*scrollSpeed;
	}
	
	//horizontal scrolling
	if (keyStates["A"]) {
		scrollX -= tileSize*scrollSpeed;
	}
	else if (keyStates["D"]) {
		scrollX += tileSize*scrollSpeed;
	}
	
	//keep scroll values in-bounds, such that at least 1 tile is visible at all times
	scrollX = Math.min(Math.max(scrollX, -cnv.width + tileSize),scripts[activeMap.name].map[0].length*tileSize - tileSize);
	scrollY = Math.min(Math.max(scrollY, -cnv.height + tileSize),scripts[activeMap.name].map.length*tileSize - tileSize);

}

/**
 * render all objects and HUD elements
 */
function render() {
	//clear all canvases for a fresh render
	clearScreen();
	
	//draw the map tiles first
	drawMap();
	
	//draw objects centered in order
	for (var i = 0; i < objects.length; ++i) {
		drawCentered(objects[i].image,objects[i].canvas.getContext("2d"), objects[i].x, objects[i].y,objects[i].dir);
	}
	
	//finally draw the HUD
	drawHUD();
}

/**
 * check if a group of numTiles with topleft coordinates x,y is at all visible on the screen
 * @param x: the leftmost coordinate of the desired tile group
 * @param x: the topmost coordinate of the desired tile group
 * @param numTiles: how many tiles worth of distance should we consider. Defaults to 1.
 * @returns whether a tile with the input topleft coordinates is at least partially visible (true) or not (false)
 */
function tileVisible(x,y,numTiles) {
	if (numTiles == null) {
		numTiles = 1;
	}
	var extents = numTiles * tileSize;
	return x*tileSize-scrollX < cnv.width && x*tileSize-scrollX > -extents && 
	y*tileSize-scrollY < cnv.height && y*tileSize-scrollY > -extents;
}

/**
 * get the distance of a group of numTiles with topleft coordinates x,y from the mouse pointer
 * @param x: the leftmost coordinate of the desired tile group
 * @param x: the topmost coordinate of the desired tile group
 * @param numTiles: how many tiles worth of distance should we consider. Defaults to 1.
 * @returns the distance (in pixels) of the tile group from the mouse pointer
 */
function tileMouseDistance(x,y,numTiles) {
	if (numTiles == null) {
		numTiles = 1;
	}
	var extents = numTiles * tileSize;
	var centerX = x*tileSize-scrollX + extents/2;
	var centerY = y*tileSize-scrollY + extents/2;
	return getDistance(centerX,centerY,cnv.mousePos.x,cnv.mousePos.y);
}

/**
 * check whether or not the mouse is hovering over the current tile container
 * @param x: the leftmost coordinate of the desired tile group
 * @param x: the topmost coordinate of the desired tile group
 * @returns whether the container at topleft position x,y currently contains the mouse pointer (true) or not (false)
 */
function checkContainerHovering(x,y) {
	var extents = containerSize * tileSize;
	var centerX = x*tileSize-scrollX + extents/2;
	var centerY = y*tileSize-scrollY + extents/2;
	return pointInRect(cnv.mousePos.x, cnv.mousePos.y, {x:centerX, y:centerY, width:extents, height:extents});
}

/**
 * draw the HUD
 */
function drawHUD() {
	//display our text-labels
	for (var i = 0; i < buttons.length; ++i) {
		var btnctx = buttons[i].canvas.getContext("2d");
		//fill light blue border color
		btnctx.fillStyle = "rgb(" +  
		Math.round(.15 * buttons[i].blendWhiteness) + ", " + 
		Math.round(buttons[i].blendWhiteness *.75) + ", " + 
		Math.round(.1 * buttons[i].blendWhiteness) + ")";
		btnctx.fillRect(buttons[i].x, buttons[i].y, buttons[i].width,buttons[i].height);
		
		//fill blue inner color
		btnctx.fillStyle = "rgb(" + 
		Math.round(buttons[i].blendWhiteness *.1) + ", " + 
		Math.round(.15 * buttons[i].blendWhiteness) + ", " + 
		Math.round(.75 * buttons[i].blendWhiteness) + ")";
		btnctx.fillRect(buttons[i].x + 2, buttons[i].y + 2, buttons[i].width - 4,buttons[i].height - 4);
		
		//set the font size and color depending on the button's attributes and state
		btnctx.font = buttons[i].fontSize + "px Arial";
		btnctx.fillStyle = "rgb(" + buttons[i].blendWhiteness + ", " + buttons[i].blendWhiteness + ", " + buttons[i].blendWhiteness + ")";
		
		//draw the button label (add slight position offset to account for line spacing)
		btnctx.fillText(buttons[i].text,buttons[i].x + 4, buttons[i].y + buttons[i].height/2 + 8);
	}
	uictx.font = "24px Arial";
	uictx.fillStyle = "#FFFFFF";
	uictx.fillText("Scroll: " + scrollX + ", " + scrollY, 10,30);
	uictx.fillText("Zoom: " + (tileSize == 16 ? "large" : (tileSize == 8 ? "normal" : "small")), 10,80);
	uictx.fillText("Settings:",10,130);
	uictx.fillText("Actions:",10,410);
	uictx.fillText("Heuristic Weights:",10,630);
}

/**
 * draw the global path and closedSet
 */
function drawPath() {
	//first draw the closedSet
	//ctx.fillStyle = "rgba(255,255,255," + (activeMode == modes.tile ? ".5)" : "1)");
	ctx.fillStyle = "rgba(255,255,255,1)";
	for (var i = 0; i < closedSet.length; ++i) {
		ctx.fillRect(closedSet[i].x*tileSize-scrollX+1,closedSet[i].y*tileSize-scrollY+1,tileSize*containerSize-2,tileSize*containerSize-2);
	}
	//next draw the openSet
//	ctx.fillStyle = "rgba(255,255,255,.5)";
//	for (var i = 0; i < openSet.length; ++i) {
//		ctx.fillRect(openSet[i].x*tileSize-scrollX+1,openSet[i].y*tileSize-scrollY	+1,tileSize*containerSize-2,tileSize*containerSize-2);
//	}
//	ctx.closePath();
	
	//now draw the final path
	ctx.fillStyle = "rgba(0,0,255,1)";
	for (var i = 0; i < path.length; ++i) {
		ctx.fillRect(path[i].x*tileSize-scrollX+1,path[i].y*tileSize-scrollY+1,tileSize*containerSize-2,tileSize*containerSize-2);
	}
	ctx.closePath();
}

/**
 * draw the currently active map to the screen
 */
function drawMap() {
	//first draw the map itself (rendered to a canvas only when updated)
	ctx.drawImage(mapCnv, -scrollX, -scrollY);

	//second pass: draw tile containers
	var map = scripts[activeMap.name].map;
	var hoveringContainer = null;
	
	//gather all valid and invalid tiles in range of the mouse
	var validMouseTiles = [];
	var invalidMouseTiles = [];
	for (var i = 0; i < map.length; i += containerSize) {
		for (var r = 0; r < map[i].length; r += containerSize) {
			if (tileMouseDistance(r,i,containerSize) <= maxMouseDistance && tileVisible(r,i,containerSize)) {
				//check for mouse hovering over tiles here so we don't waste time checking every tile again
				if (checkContainerHovering(r,i)) {
					hoveringContainer = [r,i];
					//add a block on left mouse press, and remove a block on right mouse press
					if (mouseDownLeft) {
						//don't add start or goal spaces to invalid areas
						if (activeBlockType == blockTypes.obstacle || containerWalkable(map,r,i)) {
							addBlock(r,i);
						}
					}
					else if (mouseDownRight) {
						removeBlock(r,i);
					}
				}
				//add the current tile to either valid or invalid list, depending on whether or not it is walkable
				if (containerWalkable(map,r,i)) {
					validMouseTiles.push([r,i]);
				}
				else {
					invalidMouseTiles.push([r,i]);
				}
			}
		}
	}
		
	//draw valid tiles in green
	ctx.beginPath();
	ctx.fillStyle = "rgba(0,255,0,.5)";
	for (var i = 0; i < validMouseTiles.length; ++i) {
		ctx.fillRect(validMouseTiles[i][0]*tileSize-scrollX+1,validMouseTiles[i][1]*tileSize-scrollY+1,tileSize*containerSize-2,tileSize*containerSize-2);
	}
	ctx.closePath();
	
	//draw invalid tiles in red
	ctx.beginPath();
	ctx.fillStyle = "rgba(255,0,0,.5)";
	for (var i = 0; i < invalidMouseTiles.length; ++i) {
		ctx.fillRect(invalidMouseTiles[i][0]*tileSize-scrollX+1,invalidMouseTiles[i][1]*tileSize-scrollY+1,tileSize*containerSize-2,tileSize*containerSize-2);
	}
	ctx.closePath();
	
	//draw path and closedSet
	drawPath();
	
	//draw user-added blocks
	for (var block in blocks) {
	    if (blocks.hasOwnProperty(block)) {
	    	if (tileVisible(blocks[block].x,blocks[block].y,containerSize)) {
	    		ctx.drawImage(images[
	    			(blocks[block].type == blockTypes.obstacle ? "userBlock" : (blocks[block].type == blockTypes.goal ? "goalSpace" : "startSpace"))
	    				+ (tileSize == 16 ? "" : (tileSize == 8 ? " small" : " tiny"))],
	    				blocks[block].x*tileSize-scrollX,blocks[block].y*tileSize-scrollY);	
	    	}
	    }
    }
	
	//if the mouse is hovering over a tile container, render it again with double thickness
	if (hoveringContainer) {
		ctx.fillStyle = containerWalkable(map,hoveringContainer[0],hoveringContainer[1]) ? "rgba(0,255,0,1)" : "rgba(255,0,0,1)";
		ctx.beginPath();
		ctx.fillRect(hoveringContainer[0]*tileSize-scrollX,hoveringContainer[1]*tileSize-scrollY,tileSize*containerSize,tileSize*containerSize);
		ctx.closePath();
	}
	
	if (activeMode == modes.waypoint) {
		var waypoints = scripts[activeMap.name].waypoints;
		//draw waypoint connections as white lines
		ctx.strokeStyle = "rgba(255,255,255,1)";
		ctx.lineWidth = tileSize/4;
		for (var wp in waypoints) {
		    if (waypoints.hasOwnProperty(wp)) {
		    	var coords = wp.split(",");
		    	coords[0] = parseInt(coords[0],10);
		    	coords[1] = parseInt(coords[1],10);
				for (var r = 0; r < waypoints[wp].length; ++r) {
					ctx.beginPath();
					ctx.moveTo(coords[0]*tileSize-scrollX + tileSize,coords[1]*tileSize-scrollY + tileSize);
					ctx.lineTo(waypoints[wp][r].x*tileSize-scrollX + tileSize,waypoints[wp][r].y*tileSize-scrollY + tileSize);
					ctx.stroke();
					ctx.closePath();
				}	
		    }
		}
		
		//draw solid blue lines for waypoint connections that are part of the path
		ctx.strokeStyle = "rgba(0,0,255,1)";
		ctx.lineWidth = tileSize/2;
		for (var i = 0; i < path.length; ++i) {
			if (waypoints.hasOwnProperty(path[i].x+","+path[i].y)) {
				if (path[i].parent && waypoints.hasOwnProperty(path[i].parent.x + "," + path[i].parent.y)) {
					ctx.beginPath();
					ctx.moveTo(path[i].x*tileSize-scrollX + tileSize,path[i].y*tileSize-scrollY + tileSize);
					ctx.lineTo(path[i].parent.x*tileSize-scrollX + tileSize,path[i].parent.y*tileSize-scrollY + tileSize);
					ctx.stroke();
					ctx.closePath();	
				}
			}
		}
		
		//draw waypoints as blue circles
		ctx.fillStyle = "rgba(0,0,255,1)";
		for (var wp in waypoints) {
		    if (waypoints.hasOwnProperty(wp)) {
		    	var coords = wp.split(",");
		    	coords[0] = parseInt(coords[0],10);
		    	coords[1] = parseInt(coords[1],10);
				ctx.beginPath();
				ctx.arc(coords[0]*tileSize-scrollX + tileSize, coords[1]*tileSize-scrollY + tileSize, tileSize/2, 0, 2 * Math.PI, false);
				ctx.fill();
				ctx.closePath();
		    }
		}	
	}
}

/**
 * get the adjacent container to terrain indices x,y in direction dir
 * @param terrain: the terrain to check against
 * @param x: the first index representing the desired terrain position
 * @param y: the second index representing the desired terrain position
 * @param dir: the direction (up, down, left, or right) of the adjacent container to return
 * @returns an object containing the x,y indicies of the desired container, or null if no such container exists
 * @throws: direction error if dir is not one of the cardinal directions, position error if final x,y is not contained in terrain
 */
function adjacentContainer(terrain,x,y,dir) {
	if (!directions.contains(dir)) {
		throw "ERROR: getAdjacent direction: '" + dir + "' not recognized";
	}
	
	if (dir == directions.up) {
		if (y >= containerSize) {
			return {"x":x,"y":y-containerSize};
		}
	}
	else if (dir == directions.down) {
		if (y < terrain.length-containerSize) {
			return {"x":x,"y":y+containerSize};
		}
	}
	else if (dir == directions.left) {
		if (x >= containerSize) {
			return {"x":x-containerSize,"y":y};
		}
	}
	else if (dir == directions.right) {
		if (x < terrain[y].length - containerSize) {
			return {"x":x+containerSize,"y":y};
		}
	}
	throw "ERROR: no block adjacent to position '" + x + ", " + "'" + y + "' in direction '" + dir.name + "' exists in specified terrain";
}

/**
 * get all adjacent waypoints to terrain indices x,y
 * @param terrain: the terrain to check against
 * @param x: the first index representing the desired terrain position
 * @param y: the second index representing the desired terrain position
 * @returns a list of objects containing the x,y indices and type of all valid adjacent containers
 */
function adjacentWaypoints(waypoints,x,y) {
	if (!containerIsWaypoint({"x":x,"y":y},waypoints)) {
		console.log(waypoints);
		throw "ERROR: no waypoint found at location '" + x + "', '" + y + "'";
	}
	
	return waypoints[x+","+y];
}


/**
 * get all adjacent containers to terrain indices x,y
 * @param terrain: the terrain to check against
 * @param x: the first index representing the desired terrain position
 * @param y: the second index representing the desired terrain position
 * @returns a list of objects containing the x,y indices and type of all valid adjacent containers
 */
function adjacentContainers(terrain,x,y) {
	var newContainers = [];
	var directionList = [directions.up,directions.left,directions.down,directions.right];
	for (var i = 0; i < directionList.length; ++i) {
		try {
			newContainers.push(adjacentContainer(terrain,x,y,directionList[i]));	
		}
		//continue gracefully if an adjacent block did not exist in the specified direction
		catch(err) {
			continue;
		}
	}
	return newContainers;
}

/**
 * get whether or not the container at location x,y on terrain can be traversed
 * @param terrain: the terrain to check against
 * @param x: the first index representing the desired terrain position
 * @param y: the second index representing the desired terrain position
 * @returns whether the desired container can be traversed (true) or not (false)
 */
function containerWalkable(terrain,x,y) {
	//can't walk on containers that contain more than one non-walkable tile
	var blockPercentage = 0;
	for (var i = 0; i < 2; ++i) {
		for (var r = 0; r < 2; ++r) {
			if (terrain[y+i][x+r] != '.' && ++blockPercentage == 2) {
				return false;
			}
		}
	}
	
	//cant walk on containers that are covered by a user block
	return (!(blocks[x+","+y] && blocks[x+","+y].type == blockTypes.obstacle));
}

/**
 * add a user-added block to location x,y, if one does not exist there
 * @param x: the leftmost coordinate of the desired tile group
 * @param x: the topmost coordinate of the desired tile group
 * @returns whether a block was added to the specified location (true) or not (false)
 */
function addBlock(x,y) {
	//we can't have more than one of any block type besides obstacle
	if (activeBlockType != blockTypes.obstacle) {
		for (var block in blocks) {
		    if (blocks.hasOwnProperty(block)) {
		    	if (blocks[block].type == activeBlockType) {
		    		//this block type already exists, so we can't add another one
		    		return;
		    	}
		    }
		}
	}
	desiredBlock = blocks[x+","+y];
	if (!desiredBlock) {
		//no block was found, so add one
		blocks[x+","+y] = {"x":x,"y":y, "type":activeBlockType};
		return true;
	}
	
	//this spot is already occupied by a block
	return false;
}

/**
 * remove a user-added block from location x,y, if one exists there
 * @param x: the leftmost coordinate of the desired tile group
 * @param x: the topmost coordinate of the desired tile group
 * @returns whether a block was removed from the specified location (true) or not (false)
 */
function removeBlock(x,y) {
    if (blocks.hasOwnProperty(x+","+y)) {
    	delete blocks[x+","+y];
    	return true;
    }
    return false;
}


/**
 * initialize a reference to each of our canvases and contexts
 */
function initCanvases() {
	//create appropriately named references to all of our canvases
	cnv = document.getElementById("cnv");
	ctx = cnv.getContext("2d");
	
	uicnv = document.getElementById("uicnv");
	uictx = uicnv.getContext("2d");
}

/**
 * load the asset loader, which will load all of our required elements in order
 */
function loadAssets() {
	//setup a global, ordered list of asset files to load
	requiredFiles = [
		"src\\util.js","src\\setupKeyListeners.js", //misc functions
		"ext\\enums\\enums.js", //external dependencies
		"images\\tree.png", "images\\floor.png", "images\\void.png", //normal tile images
		"images\\tree small.png", "images\\floor small.png", "images\\void small.png", //small tile images
		"images\\tree tiny.png", "images\\floor tiny.png", "images\\void tiny.png", //tiny tile images
		"images\\userBlock.png", "images\\userBlock small.png", "images\\userBlock tiny.png", //user block images
		"images\\startSpace.png", "images\\startSpace small.png", "images\\startSpace tiny.png", //goal space images
		"images\\goalSpace.png", "images\\goalSpace small.png", "images\\goalSpace tiny.png", //start space images
		"maps\\arena2.js", "maps\\hrt201n.js", //maps
		"src\\classes\\Button.js" //classes
		];
	
	//manually load the asset loader
	var script = document.createElement('script');
	script.type = 'text/javascript';
	script.src = "src\\loadAssets.js";
	script.onload = loadAssets;
	//begin loading the asset loader by appending it to the document head
    document.getElementsByTagName('head')[0].appendChild(script);
}

/**
 * initialize all global variables
 */
function initGlobals() {
	//keep a global fps flag for game-speed (although all speeds should use deltaTime)
	fps = 60;
	
	//init global time vars for delta time calculation
	prevTime = Date.now();
	deltaTime = 0;
	totalTime = 0;
	
	//store map enum as well as a key of map contents to image names
	maps = new enums.Enum("arena2", "hrt201n");
	//keep a pre-rendered version of the map on a separate canvas for performance reasons
	mapCnv = document.createElement('canvas');
	mapCtx = mapCnv.getContext("2d");
	
	activeMap = maps.hrt201n;
	imageKey = {'T':"tree",'.':"floor",'@':"void"}
	
	//global game settings
	//tile size describes the size of a single tile (in pixels)
	tileSize = 8;
	//container size describes how many rows and columns of tiles fit into each container
	containerSize = 2;
	//scroll values dictate the current camera scroll (in pixels)
	scrollX = 0;
	scrollY = 0;
	
	//max mouse distance stores the maximum distance a container can be from the mouse in order to still be rendered
	maxMouseDistance = 200;
	
	//game-modes enum
	modes = new enums.Enum("tile","waypoint");
	activeMode = modes.tile;
	
	//placeable block types enum
	blockTypes = new enums.Enum("obstacle", "start", "goal");
	activeBlockType = blockTypes.obstacle;
	
	//cardinal directions enum
	directions = new enums.Enum("up","left","down","right");
	
	//global game objects
	objects = [];
	
	//global list of UI buttons
	buttons = [];
	buttons.push(new Button(10,150,uicnv,"Map: hrt201n",24,changeMap));
	buttons.push(new Button(10,210,uicnv,"Representation: tile          ",24,changeMode));
	buttons.push(new Button(10,270,uicnv,"Show Tiles: Near Mouse",24,changeMaxMouseDistance));
	buttons.push(new Button(10,330,uicnv,"Block Type: obstacle",24,changeBlockType));
	buttons.push(new Button(10,430,uicnv,"Find Path",24,findPath));
	buttons.push(new Button(10,490,uicnv,"Clear Results",24,clearResults));
	buttons.push(new Button(10,550,uicnv,"Clear Blocks",24,clearBlocks));
	buttons.push(new Button(10,650,uicnv,"Linear Distance: 100%",24,changeHeuristicWeight,1));
	buttons.push(new Button(10,710,uicnv,"Manhattan Distance: 100%",24,changeHeuristicWeight,2));
	
	//object containing hashed block locations in form x,y
	blocks = {};
	
	//add connections between waypoints once at game start
	connectWaypoints();
	
	//render the map once at game start
	renderMap();
	
	//make pathfinding sets and path global so we can display searched blocks after pathfinding
	closedSet = [];
	openSet = [];
	path = [];
	
	//store heuristic rates, to be modified by the user if desired
	heuristic1Weight = 1;
	heuristic2Weight = 1;
}

//disallow right-click context menu as right click functionality is necessary for block removal
document.body.addEventListener('contextmenu', function(e) {
    e.preventDefault();
});

//initialize a reference to the canvas first, then begin loading the game
initCanvases();
loadAssets();