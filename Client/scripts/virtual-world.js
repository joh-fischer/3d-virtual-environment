var useKeysForMovement = true;
var freeCam = false;

gl.captureMouse();
gl.captureKeys();
gl.onmouse = onMouse;
gl.onkeydown = onKey;

/* Movement */
function adjustCameraPosition(node) {
    if (freeCam)
        return;
    var eye = node.localToGlobal([0, 6, -6]);
    var center = node.localToGlobal([0, 4, 5]);
    var alpha = 0.1;
    if (!useKeysForMovement)
        alpha = 0.05;
    vec3.lerp(eye, camera.position, eye, alpha);
    vec3.lerp(center, camera.target, center, alpha);
    // force camera to be inside
    eye = current_room.walkArea.adjustPosition( eye );
    camera.lookAt(eye, center, [0, 1, 0]);
}

function userMovement( node, dt ) {
	var delta = [0,0,0];
	if( gl.keys["W"] )
		delta[2] = 1;
	else if( gl.keys["S"] )
		delta[2] = -1;
	vec3.scale( delta, delta, dt * current_room.speed * 5 );
	var is_moving = vec3.length(delta);
	if(is_moving) {
		node.moveLocal( delta );
		node.anim_name = "walking";
        node.dance = false;
        freeCam = false;
	}
	else
        node.anim_name = node.dance ? "dancing" : "idle";

    var is_rotating = false;
	if( gl.keys["A"] ) {
        is_rotating = true;
        node.rotate(dt*1.5,[0,1,0]);
    } else if (gl.keys["D"]) {
        is_rotating = true;
        node.rotate(dt*-1.5,[0,1,0]);
    }

    node.position = current_room.walkArea.adjustPosition( node.position );

    if (is_moving || is_rotating) {
        var msg = new Msg("movement", localUserInfo.username, "", [node.position, node.rotation], localUserInfo.roomName);
        wsClient.send(JSON.stringify( msg ));
    }
}

function moveAvatar(avatar, dt) {
    if (inRange(avatar.position, avatar.goal, 0.5)) {
        avatar.anim_name = "idle";
        return;
    } else {
        avatar.anim_name = "walking";
        //var nextPosition = avatar.position;
        var delta = [0,0,1];
        vec3.scale( delta, delta, dt * current_room.speed * 5 );
        var nextPosition = avatar.localToGlobal(delta);
        nextPosition = current_room.walkArea.adjustPosition(nextPosition);
        avatar.position = nextPosition;
    }
}

function setGoalOfAvatar(avatar, goal) {
    avatar.lookAt(avatar.position, goal, [0,1,0], true);
    avatar.goal = current_room.walkArea.adjustPosition(goal);
}

function moveOtherUser(avatar) {
    if (avatar.movementQueue.length == 0) {
        avatar.anim_name = avatar.dance ? "dancing" : "idle";
    } else {
        var nextMove = avatar.movementQueue.shift();
        if (!inRange(nextMove[0], avatar.position, 0.001)) {
            avatar.anim_name = "walking";
        } 
        // 0: position, 1: rotation
        avatar.position = nextMove[0];
        avatar.rotation = nextMove[1];
    }
}

/* CONTROLLER */
function changeRoom(room) {
    // delete characters from old room
    if (current_room) {
        for (var idx = 0; idx < characterNodes.length; ++idx) {
            var characterNode = characterNodes[idx];
            removeCharacterNode(current_room, characterNode);
        }
    }
    characterNodes = [];
    // add characters to new room
    for (var username in room.characters) {
        var characterData = room.characters[username];
        var characterNode = createCharacterNode(username, characterData);
        addCharacterNode(room, characterNode);
        if (username == localUserInfo.username) {
            mainCharacter = characterNode;
        }
    }

    current_room = room;
}

function beginTransitionProcess(from, to) {
    var entrancePosition = null;
    if (to == "main") {
        switch (from) {
            case "alpine":
                entrancePosition = [0, 0, 70];
                break;
            case "universe":
                entrancePosition = [0, 0, -70];
                break;
            case "red":
                entrancePosition = [70, 0, 0];
                break;
            case "modernArt":
                entrancePosition = [-70, 0, 0];
                break;
        }
    } else {
        entrancePosition = [0, 0, 15];
    }
    mainCharacter.anim_name = "idle";
    mainCharacter.position = entrancePosition;
    mainCharacter.lookAt(entrancePosition, [0, 0, 0], [0,1,0], true);

    TRANSITION.process = true;
    TRANSITION.from = from;
    TRANSITION.to = to;
    TRANSITION.position = entrancePosition;
    TRANSITION.rotation = mainCharacter.rotation;
    TRANSITION.texture = localUserInfo.texture;
    var transitionMsg = new Msg("transition", localUserInfo.username, localUserInfo.id, TRANSITION);
    sendMsg( transitionMsg );
}

function transitTo(room) {
    // perform the transition
    changeRoom(room);

    mainCharacter.anim_name = "idle";
    mainCharacter.lookAt(TRANSITION.position, [0, 0, 0], [0,1,0], true);
    if (room.name != "main")
        camera.position = new Float32Array([-0.3, 6, 19.5]);
    var rotationMsg = new Msg("rotation", localUserInfo.username, localUserInfo.id, mainCharacter.rotation);
    sendMsg( rotationMsg );
    
    TRANSITION.process = false;
}

function checkTransitionAreas(room, position) {
    if (room.name == "main") {
        for (var area in room.transitArea) {
            if (room.transitArea[area].isInsideArea(position)) {
                beginTransitionProcess("main", area);
                break;
            }
        }
    } else {
        if (room.transitArea.isInsideArea(position)) {
            beginTransitionProcess(room.name, "main");
        }
    }
}

/* Rendering */
function update(dt) {
    var t = getTime() * 0.001;

    // update animations of all characters
    for (var idx = 0; idx < characterNodes.length; ++idx) {
        var character = characterNodes[idx];
        if (character.id != localUserInfo.username)
            moveOtherUser(character);
        var anim = animations[ character.anim_name ];
        if (character.anim_name == "walking")
            t = t*current_room.speed;
        if (anim && anim.duration) {
            anim.assignTime( t, true , true);
            character.assignSkeleton( anim.skeleton );
            character.shader = "texture_skinning";
            character.skeleton = anim.skeleton; //this could be useful
        }
    }

    // user movement
    if (useKeysForMovement)
        userMovement( mainCharacter, dt );
    else
        moveAvatar( mainCharacter, dt );
        

    // check for transitions
    if (!TRANSITION.process)
        checkTransitionAreas(current_room, mainCharacter.position);

    // move other avatar
    //moveAvatar(brown, dt);

    // camera
    adjustCameraPosition( mainCharacter );
}

function draw() {
    camera.perspective(camera.fov, DOM.canvas.width/DOM.canvas.height, 0.1, 1000);
    
    gl.viewport(0,0, DOM.canvas.width, DOM.canvas.height);
    gl.clearColor(0,0,0,1);
    gl.clear( gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    
    renderer.render( current_room.scene, camera);   

    if (debug) drawWalkingArea(current_room.walkArea, camera);
}

function drawWalkingArea(area, cam) {
    var vertices = area.getVertices();
	if(vertices)
		renderer.renderPoints(vertices,null,cam,null,null,0.1,gl.LINES);
}

function inRange(pos1, pos2, range) {
    var x1 = pos1[0];
    var x2 = pos2[0];
    var z1 = pos1[2];
    var z2 = pos2[2];
    var distance = Math.abs( ((x2 - x1)**2 + (z2 - z1)**2)**0.5 )
    if (distance < range)
        return true;
    else
        return false;
}

function onKey(e) {
    if (e.code == "Space") {
        e.preventDefault();
        mainCharacter.dance = !mainCharacter.dance;
        var danceMsg = new Msg("dance", localUserInfo.username, localUserInfo.id, mainCharacter.dance, localUserInfo.roomName);
        sendMsg(danceMsg);
    }
}

function onMouse(e) {
    if (e.dragging && e.buttons == 4) {
            freeCam = true;
			camera.orbit(e.deltax * 0.01, [0, 1, 0]);
    } else if (e.type == "mousedown") {
        closeActiveMenu();
        if (!useKeysForMovement) {
            var ray = camera.getRay(e.canvasx, e.canvasy);
            var coll = ray.testPlane([0,0,0], [0,1,0]);
            if (coll) {
                var goalPoint = current_room.walkArea.adjustPosition( ray.collision_point );
                setGoalOfAvatar(mainCharacter, goalPoint);
            }
        }

        // check for collision with art
        var ray = camera.getRay( e.canvasx, e.canvasy );
        var coll_node = current_room.scene.testRay( ray );
        if (coll_node) {
            if (debug) console.log("Clicked on ", coll_node.name);
            if (Object.getOwnPropertyNames(ART).includes(coll_node.name))
                openArtInfo(coll_node.name);
            else if (Object.getOwnPropertyNames(UPLOAD).includes(coll_node.name))
                openUploadImg(coll_node.name);
            else if (coll_node.name != localUserInfo.username && Object.getOwnPropertyNames(current_room.characters).includes(coll_node.name))
                clickedOnCharacter(coll_node.name);
        }
    }
}

function adaptWindow() {
    var parent = DOM.canvas.parentNode;
    var rect = parent.getBoundingClientRect();
    
    DOM.canvas.width = rect.width;
    DOM.canvas.height = rect.height;
}

var last = performance.now();
function loop() {
    if (!mainCharacter)
        mainCharacter = getCharacterNodeByName(localUserInfo.username);

    if (!run_loop)
        return;
    
    // drawing
    adaptWindow();
    draw();
    
    var now = performance.now();
    var elapsed_time = (now - last) / 1000;
    last = now;
    update(elapsed_time);
    requestAnimationFrame( loop );
}