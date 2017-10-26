/**
 * clear the canvas to a predetermined fillcolor, preparing it for a fresh render
 */
function clearScreen() {
	ctx.fillStyle="rgb(40,120,255)";
	ctx.fillRect(0,0,cnv.width,cnv.height);
}

/**
 * main game loop; update all aspects of the game in-order
 */
function update() {
	//update the deltaTime
	updateTime();
	
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
 * draw the currently active map to the screen
 */
function drawMap() {
	var map = scripts[activeMap.name].map;
	//first sweep: draw grid contents
	for (var i = 0; i < map.length && i*tileSize < cnv.width; ++i) {
		for (var r = 0; r < map[i].length && r*tileSize < cnv.height; ++r) {
			ctx.drawImage(images[imageKey[map[i][r]]],i*tileSize,r*tileSize);
		}
	}
	//second sweep: draw grid lines
	ctx.strokeStyle = "#000000";
	ctx.lineWidth="2";
	for (var i = 0; i < map.length && i*tileSize < cnv.width; ++i) {
		for (var r = 0; r < map[i].length && r*tileSize < cnv.height; ++r) {
			ctx.rect(i*tileSize,r*tileSize,tileSize,tileSize);
		}
	}
	ctx.stroke();
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
	
	//init global time vars for delta time calculation
	prevTime = Date.now();
	deltaTime = 0;
	totalTime = 0;
	
	//store map enum as well as a key of map contents to image names
	maps = new enums.Enum("arena2", "hrt201n");
	activeMap = maps.arena2;
	imageKey = {'T':"tree",'.':"floor",'@':"void"}
	
	//global game settings
	tileSize = 32;
		
	//global game objects
	objects = [];
}

//initialize a reference to the canvas first, then begin loading the game
initCanvas();
loadAssets();