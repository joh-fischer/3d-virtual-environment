const CHARACTER_LAYER = 4;
const FLOOR_LAYER = 5;

var TRANSITION = {
    process: false,
    from: "",
    to: "",
    position: null,
    rotation: null,
}

var gl = GL.create({canvas: DOM.canvas});

gl.enable( gl.DEPTH_TEST );

// wrapper
var world = {
    main: {
        name: "main",
        scene: null,
        walkArea: new WalkArea(),
        transitArea: {
            alpine: new WalkArea(),
            universe: new WalkArea(),
            modernArt: new WalkArea(),
            red: new WalkArea(),

        },
        speed: 3,
        characters: []
    },

    alpine: {
        name: "alpine",
        scene: null,
        walkArea: new WalkArea(),
        transitArea: new WalkArea(),
        speed: 2,
        characters: []
    },

    universe: {
        name: "universe",
        scene: null,
        walkArea: new WalkArea(),
        transitArea: new WalkArea(),
        speed: 2,
        characters: []
    },

    modernArt: {
        name: "modernArt",
        scene: null,
        walkArea: new WalkArea(),
        transitArea: new WalkArea(),
        speed: 2,
        characters: []
    },
    red: {
        name: "red",
        scene: null,
        walkArea: new WalkArea(),
        transitArea: new WalkArea(),
        speed: 2,
        characters: []
    }
}

var renderer = new RD.Renderer( gl );

var camera = new RD.Camera();
camera.lookAt([4,4,4], [0,0,0], [0,1,0]);
camera.fov = 90;

/* Main Room */
// walking areas
world.main.walkArea.addRect([-69, 0.1, -69], 64.5, 138);
world.main.walkArea.addRect([4.5, 0.1, -69], 64.5, 138);
// entrance of big areas
world.main.walkArea.addRect([69, 0.1, -5.5], 10, 11);
world.main.walkArea.addRect([-79, 0.1, -5.5], 10, 11);
// two small areas
world.main.walkArea.addRect([-5.5, 0.1, 4.5], 11, 74);
world.main.walkArea.addRect([-5.5, 0.1, -78.5], 11, 74);
// transit areas
world.main.transitArea.alpine.addRect([-5.5, 0.1, 71.5], 11, 7);
world.main.transitArea.universe.addRect([-5.5, 0.1, -78.5], 11, 7);
world.main.transitArea.modernArt.addRect([-79, 0.1, -5.5], 7, 11);
world.main.transitArea.red.addRect([72, 0.1, -5.5], 7, 11);

// node
var scene_main = new RD.Scene();
var room_main = new RD.SceneNode();
room_main.name = "main";
room_main.loadGLTF("./data/rooms/main.glb");
room_main.position = [0, 0, 0];
//room_main.flags.two_sided = true;
scene_main.root.addChild( room_main );

world.main.scene = scene_main;
/* ------------------- */


/* Rooms */
// alpine
world.alpine.walkArea.addRect([-26.5, 0.1, -14], 53, 28);
world.alpine.walkArea.addRect([-29, 0.1, -11], 58, 22);
// door walk area
world.alpine.walkArea.addRect([-1.2, 0.1, 14], 2.4, 5.5);
world.alpine.transitArea.addRect([-1.2, 0.1, 16], 2.4, 4);

// universe
world.universe.walkArea.addRect([-26, 0.1, -14], 22.5, 28);
world.universe.walkArea.addRect([3.5, 0.1, -14], 22.5, 28);
//world.universe.walkArea.addRect([-26.5, 0.1, -14], 53, 28);
world.universe.walkArea.addRect([-29, 0.1, -11], 58, 8.5);
world.universe.walkArea.addRect([-29, 0.1, 2.5], 58, 8.5);
//world.universe.walkArea.addRect([-29, 0.1, -11], 58, 22);
world.universe.walkArea.addRect([-26, 0.1, -14], 52, 3);
world.universe.walkArea.addRect([-26, 0.1, 11], 52, 3);
world.universe.walkArea.addRect([-29, 0.1, -11], 3, 22);
world.universe.walkArea.addRect([26, 0.1, -11], 3, 22);
// door walk area
world.universe.walkArea.addRect([-1.2, 0.1, 14], 2.4, 5.5);
world.universe.transitArea.addRect([-1.2, 0.1, 16], 2.4, 4);

// modern art
world.modernArt.walkArea.addRect([-26.5, 0.1, -14], 53, 28);
world.modernArt.walkArea.addRect([-29, 0.1, -11], 58, 22);
// door walk area
world.modernArt.walkArea.addRect([-1.2, 0.1, 14], 2.4, 5.5);
world.modernArt.transitArea.addRect([-1.2, 0.1, 16], 2.4, 4);

// red
world.red.walkArea.addRect([-26.5, 0.1, -14], 53, 28);
world.red.walkArea.addRect([-29, 0.1, -11], 58, 22);
// door walk area
world.red.walkArea.addRect([-1.2, 0.1, 14], 2.4, 5.5);
world.red.transitArea.addRect([-1.2, 0.1, 16], 2.4, 4);

// nodes
// alpine
var scene_alpine = new RD.Scene();
var room_alpine = new RD.SceneNode();
room_alpine.name = "alpine";
room_alpine.loadGLTF("./data/rooms/alpine.glb");
room_alpine.position = [0, 0, 0];
//room_alpine.flags.two_sided = true;
scene_alpine.root.addChild( room_alpine );

world.alpine.scene = scene_alpine;

// universe
var scene_universe = new RD.Scene();
var room_universe = new RD.SceneNode();
room_universe.name = "universe";
room_universe.loadGLTF("./data/rooms/universe.glb");
room_universe.position = [0, 0, 0];
//room_universe.flags.two_sided = true;
scene_universe.root.addChild( room_universe );

world.universe.scene = scene_universe;

// modern art
var scene_modernArt = new RD.Scene();
var room_modernArt = new RD.SceneNode();
room_modernArt.name = "modernArt";
room_modernArt.loadGLTF("./data/rooms/art.glb");
room_modernArt.position = [0, 0, 0];
//room_universe.flags.two_sided = true;
scene_modernArt.root.addChild( room_modernArt );

world.modernArt.scene = scene_modernArt;

// red
var scene_red = new RD.Scene();
var room_red = new RD.SceneNode();
room_red.name = "red";
room_red.loadGLTF("./data/rooms/red.glb");
room_red.position = [0, 0, 0];
//room_universe.flags.two_sided = true;
scene_red.root.addChild( room_red );

world.red.scene = scene_red;
/* ------------------- */


var current_room = null;