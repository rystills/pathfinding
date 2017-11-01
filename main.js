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
	activeMode = (activeMode == modes.tile ? modes.waypoint : (activeMode == modes.waypoint ? modes.quadtree : modes.tile));
	this.text = "Representation: " + activeMode.name;
}

/**
 * change to the next map
 */
function changeMap() {
	activeMap = (activeMap == maps.arena2 ? maps.hrt201n : maps.arena2);
	renderMap();
	this.text = "Map: " + activeMap.name;
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
		//fill red border color
		btnctx.fillStyle = "rgb(" + 
		Math.round(buttons[i].blendWhiteness *.75) + ", " + 
		Math.round(.15 * buttons[i].blendWhiteness) + ", " + 
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
	uictx.fillText("Zoom: " + (tileSize == 16 ? "normal" : (tileSize == 8 ? "small" : "tiny")), 10,80);
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
						addBlock(r,i);
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
	
	//draw user-added blocks first
	for (var block in blocks) {
	    if (blocks.hasOwnProperty(block)) {
	    	if (tileVisible(blocks[block][0],blocks[block][1],containerSize)) {
	    		ctx.drawImage(images["userBlock" + (tileSize == 16 ? "" : (tileSize == 8 ? " small" : " tiny"))],
	    				blocks[block][0]*tileSize-scrollX,blocks[block][1]*tileSize-scrollY);	
	    	}
	    }
    }
		
	//draw valid tiles in green
	ctx.beginPath();
	ctx.fillStyle = "rgba(0,255,0,.5)";
	for (var i = 0; i < validMouseTiles.length; ++i) {
		ctx.fillRect(validMouseTiles[i][0]*tileSize-scrollX,validMouseTiles[i][1]*tileSize-scrollY,tileSize*containerSize,tileSize*containerSize);
	}
	ctx.stroke();
	ctx.closePath();
	
	//draw invalid tiles in red
	ctx.beginPath();
	ctx.fillStyle = "rgba(255,0,0,.5)";
	for (var i = 0; i < invalidMouseTiles.length; ++i) {
		ctx.fillRect(invalidMouseTiles[i][0]*tileSize-scrollX,invalidMouseTiles[i][1]*tileSize-scrollY,tileSize*containerSize,tileSize*containerSize);
	}
	ctx.stroke();
	ctx.closePath();
	
	//if the mouse is hovering over a tile container, render it again with double thickness
	if (hoveringContainer) {
		ctx.fillStyle = containerWalkable(map,hoveringContainer[0],hoveringContainer[1]) ? "rgba(0,255,0,1)" : "rgba(255,0,0,1)";
		ctx.beginPath();
		ctx.fillRect(hoveringContainer[0]*tileSize-scrollX,hoveringContainer[1]*tileSize-scrollY,tileSize*containerSize,tileSize*containerSize);
		ctx.stroke();
		ctx.closePath();
	}
}

/**
 * get the adjacent container to terrain indices x,y in direction dir
 * @param terrain: the terrain to check against
 * @param x: the first index representing the desired terrain position
 * @param y: the second index representing the desired terrain position
 * @param dir: the direction (up, down, left, or right) of the adjacent container to return
 * @returns an object containing the x,y indicies of the desired container, as well as its type, or null if no such container exists
 * @throws: direction error if dir is not one of the cardinal directions, position error if x,y is not contained in terrain
 */
function adjacentContainer(terrain,x,y,dir) {
	if (!directions.contains(dir)) {
		throw "ERROR: getAdjacent direction: '" + dir + "' not recognized";
	}
	
	if (dir == directions.up) {
		if (y >= containerSize) {
			return {"x":x,"y":y-containerSize, "type":terrain[y-containerSize][x]};
		}
	}
	else if (dir == directions.down) {
		if (y < terrain.length-containerSize) {
			return {"x":x,"y":y+containerSize, "type":terrain[y+containerSize][x]};
		}
	}
	else if (dir == directions.left) {
		if (x >= containerSize) {
			return {"x":x-containerSize,"y":y, "type":terrain[y][x-containerSize]};
		}
	}
	else if (dir == directions.right) {
		if (x < terrain[y].length - containerSize) {
			return {"x":x+containerSize,"y":y, "type":terrain[y][x+containerSize]};
		}
	}
	throw "ERROR: position '" + x + ", " + "y' does not exist in specified terrain";
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
			if (terrain[y+i][x+r] != '.') {
				if (++blockPercentage == 2) {
					return false;
				}
			}
		}
	}
	
	//cant walk on containers that are covered by a user block
	return (!(blocks[x+","+y]));
}

/**
 * add a user-added block to location x,y, if one does not exist there
 * @param x: the leftmost coordinate of the desired tile group
 * @param x: the topmost coordinate of the desired tile group
 * @returns whether a block was added to the specified location (true) or not (false)
 */
function addBlock(x,y) {
	desiredBlock = blocks[x+","+y];
	if (!desiredBlock) {
		blocks[x+","+y] = [x,y];
		return true;
	}
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
	
	//global keyHeld bools for single-press keys
	EHeld = false;
	QHeld = false;
	
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
	tileSize = 16;
	//container size describes how many rows and columns of tiles fit into each container
	containerSize = 2;
	//scroll values dictate the current camera scroll (in pixels)
	scrollX = 0;
	scrollY = 0;
	
	//max mouse distance stores the maximum distance a container can be from the mouse in order to still be rendered
	maxMouseDistance = 200;
	
	//game-modes enum
	modes = new enums.Enum("tile","waypoint","quadtree");
	activeMode = modes.tile;
	
	//cardinal directions enum
	directions = new enums.Enum("up","left","down","right");
	
	//global game objects
	objects = [];
	
	//global list of UI buttons
	buttons = [];
	buttons.push(new Button(10,110,uicnv,"Map: hrt201n",24,changeMap))
	buttons.push(new Button(10,170,uicnv,"Representation: tile          ",24,changeMode))
	buttons.push(new Button(10,230,uicnv,"Show Tiles: Near Mouse",24,changeMaxMouseDistance))
	
	//object containing hashed block locations in form x,y
	blocks = {};
	
	//render the map once at game start
	renderMap();
}

//disallow right-click context menu as right click functionality is necessary for block removal
document.body.addEventListener('contextmenu', function(e) {
    e.preventDefault();
});

//initialize a reference to the canvas first, then begin loading the game
initCanvases();
loadAssets();