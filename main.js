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
 * check if the user is attempting to switch maps
 */
function checkChangeMap() {
	if (keyStates["R"]) {
		//keep track of 'RHeld' to ensure that each R press only changes the map once
		if (!RHeld) {
			activeMap = (activeMap == maps.arena2 ? maps.hrt201n : maps.arena2);
			RHeld = true;
		}
	}
	else {
		RHeld = false;
	}
}

/**
 * update the camera scroll based on user input
 */
function updateScroll() {
	//vertical scrolling
	if (keyStates["W"]) {
		scrollY -= tileSize;
	}
	else if (keyStates["S"]) {
		scrollY += tileSize;
	}
	
	//horizontal scrolling
	if (keyStates["A"]) {
		scrollX -= tileSize;
	}
	else if (keyStates["D"]) {
		scrollX += tileSize;
	}
	//console.log(scrollY);

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
}

/**
 * check if a tile with topleft coordinates x,y is at all visible on the screen
 * @param x: the leftmost coordinate of the desired tile
 * @param x: the topmost coordinate of the desired tile
 * @param numTiles: how many tiles worth of distance should we consider. Defaults to 1.
 * @returns whether a tile with the input topleft coordinates is at least partially visible (true) or not (false)
 */
function tileVisible(x,y, numTiles) {
	if (numTiles == null) {
		numTiles = 1;
	}
	var extents = numTiles * tileSize;
	return x*tileSize-scrollX < cnv.width && x*tileSize-scrollX > -extents && 
	y*tileSize-scrollY < cnv.height && y*tileSize-scrollY > -extents;
}


/**
 * draw the currently active map to the screen
 */
function drawMap() {
	var map = scripts[activeMap.name].map;
	//first pass: draw tiles
	for (var i = 0; i < map.length; ++i) {
		for (var r = 0; r < map[i].length; ++r) {
			//render all map tiles that are at least partially visible
			if (tileVisible(r, i)) {
				ctx.drawImage(images[imageKey[map[i][r]]],r*tileSize-scrollX,i*tileSize-scrollY);	
			}
		}
	}
	
	//second pass: draw containers
	ctx.beginPath();
	ctx.strokeStyle = "rgba(255,255,255,.5)";
	ctx.lineWidth="2";
	for (var i = 0; i < map.length; i += containerSize) {
		for (var r = 0; r < map[i].length; r += containerSize) {
			if (tileVisible(r,i,containerSize)) {
				ctx.rect(r*tileSize-scrollX,i*tileSize-scrollY,tileSize*containerSize,tileSize*containerSize);
			}
		}
	}
	ctx.stroke();
	ctx.closePath();
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
		"images\\DebugSprite.png", "images\\tree.png", "images\\floor.png", "images\\void.png", //images
		"src\\classes\\DebugSprite.js", //classes
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
	
	//init global time vars for delta time calculation
	prevTime = Date.now();
	deltaTime = 0;
	totalTime = 0;
	
	//store map enum as well as a key of map contents to image names
	maps = new enums.Enum("arena2", "hrt201n");
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
		
	//global game objects
	objects = [];
}

//initialize a reference to the canvas first, then begin loading the game
initCanvas();
loadAssets();