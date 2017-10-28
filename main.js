/**
 * clear the canvas to a predetermined fillcolor, preparing it for a fresh render
 */
function clearScreen() {
	ctx.fillStyle="rgb(22,19,58)";
	ctx.fillRect(0,0,cnv.width,cnv.height);
}

/**
 * main game loop; update all aspects of the game in-order
 */
function update() {
	//update the deltaTime
	updateTime();
	
	//update camera scrolling
	updateScroll();
	
	//check if the user triggered a map change
	checkChangeMap();
	
	//check if the user triggered a zoom change
	checkChangeZoom();
	
	//update objects
	for (var i = 0; i < objects.length; ++i) {
		objects[i].update();
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
 * check if the user is attempting to switch maps
 */
function checkChangeMap() {
	if (keyStates["R"]) {
		//keep track of 'RHeld' to ensure that each R press only changes the mode once
		if (!RHeld) {
			activeMode = (activeMode == modes.tile ? modes.waypoint : (activeMode == modes.waypoint ? modes.quadtree : modes.tile));
			RHeld = true;
		}
	}
	else {
		RHeld = false;
	}
	
	
	if (keyStates["E"]) {
		//keep track of 'EHeld' to ensure that each E press only changes the map once
		if (!EHeld) {
			activeMap = (activeMap == maps.arena2 ? maps.hrt201n : maps.arena2);
			EHeld = true;
			renderMap();
		}
	}
	else {
		EHeld = false;
	}
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
	//start with a semi-transparent black rectangle to make text more visible
	ctx.fillStyle = "rgba(0,0,0,.5)";
	ctx.fillRect(0,0,cnv.width,50);
	
	//now display our text-labels
	ctx.font = "24px Arial";
	ctx.fillStyle = "rgba(255,255,255,1)";
	ctx.fillText("Map: " + activeMap.name,10,32);
	ctx.fillText("Scroll: " + scrollX + ", " + scrollY, 175,32);
	ctx.fillText("Mode: " + activeMode.name, 400, 32);
	ctx.fillText("Zoom: " + (tileSize == 16 ? "normal" : (tileSize == 8 ? "small" : "tiny")), 600,32);
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
	ctx.beginPath();
	ctx.lineWidth="2";
	ctx.strokeStyle = "rgba(255,255,255,.5)";
	for (var i = 0; i < map.length; i += containerSize) {
		for (var r = 0; r < map[i].length; r += containerSize) {
			if (tileVisible(r,i,containerSize) && tileMouseDistance(r,i,containerSize) <= 10*tileSize) {
				//check for mouse hovering over tiles here so we don't waste time checking every tile again
				if (checkContainerHovering(r,i)) {
					hoveringContainer = [i,r];
					if (mouseDownLeft) {
						addBlock(r,i);
					}
					else if (mouseDownRight) {
						removeBlock(r,i);
					}
				}
				ctx.rect(r*tileSize-scrollX,i*tileSize-scrollY,tileSize*containerSize,tileSize*containerSize);
			}
		}
	}
	ctx.stroke();
	ctx.closePath();
	
	//next draw user-added blocked
	for (var block in blocks) {
	    if (blocks.hasOwnProperty(block)) {
	    	if (tileVisible(blocks[block][0],blocks[block][1],containerSize)) {
	    		ctx.drawImage(images["userBlock" + (tileSize == 16 ? "" : (tileSize == 8 ? " small" : " tiny"))],
	    				blocks[block][0]*tileSize-scrollX,blocks[block][1]*tileSize-scrollY);	
	    	}
	    }
    }
	
	//if the mouse is hovering over a tile container, render it in a full white line
	if (hoveringContainer) {
		ctx.strokeStyle = "rgba(255,255,255,1)";
		ctx.beginPath();
		ctx.rect(hoveringContainer[1]*tileSize-scrollX,hoveringContainer[0]*tileSize-scrollY,tileSize*containerSize,tileSize*containerSize);
		ctx.stroke();
		ctx.closePath();
	}
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
 * initialize a reference to our canvas and context
 */
function initCanvas() {
	//create appropriately named references to all of our canvases
	cnv = document.getElementById("cnv");
	ctx = cnv.getContext("2d");
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
		"maps\\arena2.js", "maps\\hrt201n.js" //maps
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
	RHeld = false;
	EHeld = false;
	
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
	
	//game-modes enum
	modes = new enums.Enum("tile","waypoint","quadtree");
	activeMode = modes.tile;
		
	//global game objects
	objects = [];
	
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
initCanvas();
loadAssets();