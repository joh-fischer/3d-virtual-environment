var characterNodes = [];
var wrongTexture = false;

function CharacterData(texture, position, rotation, roomName) {
    this.texture = texture,
    this.position = position,
    this.rotation = rotation,
    this.roomName = roomName
}

function Character(username, texture, position) {
    var character = new RD.SceneNode();
    character.mesh = "./data/minibody/myminibody.wbin";
    character.texture = texture;
    character.name = username;
    character.id = username;
    character.layers = CHARACTER_LAYER;
    character.position = position;
    character.goal = position;
    character.dance = false;
    character.anim_name = "idle-standing";
    character.movementQueue = [];
    return character;
}

function createCharacterNode(username, characterData) {
    var character = new Character(username, characterData.texture, characterData.position); 
    return character;
}

function addCharacterNode(room, characterNode) {
    characterNodes.push(characterNode)
    room.scene.root.addChild(characterNode);
    room.characters[characterNode.name] = new CharacterData(characterNode.texture, characterNode.position, characterNode.rotation, characterNode.roomName);
}

function removeCharacterNode(room, characterNode) {
    room.scene.root.removeChild(characterNode);
    var idxOfCharacter = characterNodes.indexOf(characterNode);
    if (idxOfCharacter > -1) {
        characterNodes.splice(idxOfCharacter, 1);
    }
    if (room.characters[characterNode.name])
        delete room.characters[characterNode.name];
}

function getCharacterNodeByName(name) {
    for (var idx in characterNodes) {
        if (characterNodes[idx].name == name)
            return characterNodes[idx];
    }
    return false;
}

var mainCharacter = null;

// animation stuff
var animations = {};
function loadAnimation( name, url ) {
	var anim = new RD.SkeletalAnimation();
	anim.load(url);
	animations[ name ] = anim;
}

loadAnimation("walking", "./data/minibody/anims/minibody-walking.skanim");
loadAnimation("fallingToLanding", "./data/minibody/anims/minibody-fallingToLanding.skanim");
loadAnimation("idle-standing", "./data/minibody/anims/minibody-idle-standing.skanim");
loadAnimation("waiting", "./data/minibody/anims/minibody-waiting.skanim");
loadAnimation("dancing", "./data/minibody/anims/minibody-dancing.skanim");
loadAnimation("idle", "./data/minibody/anims/minibody-idle.skanim");

// look of the character
var characterTextures = [
    "./data/minibody/textures/criminalMaleA.png",
    
    "./data/minibody/textures/skaterFemaleA_black.png",
    "./data/minibody/textures/skaterFemaleA_brown.png",
    "./data/minibody/textures/skaterFemaleA_blond.png",
    "./data/minibody/textures/skaterFemaleA_red.png",

    "./data/minibody/textures/cyborgFemaleA.png",

    "./data/minibody/textures/skaterMaleA_black.png",
    "./data/minibody/textures/skaterMaleA_blond.png",
    "./data/minibody/textures/skaterMaleA_brown.png",
    "./data/minibody/textures/skaterMaleA_red.png"
];

function setTexture(node, tex) {
    node.textures.color = tex;
}

function nextTexture() {
    var currentTex = mainCharacter.textures.color;
    var idx = characterTextures.indexOf(currentTex);
    if (idx+1 >= characterTextures.length) {
        idx = 0;    
    } else {
        idx++;
    }
    wrongTexture = true;
    setTexture(mainCharacter, characterTextures[idx]);
}

function previousTexture() {
    var currentTex = mainCharacter.textures.color;
    var idx = characterTextures.indexOf(currentTex);
    if (idx-1 < 0) {
        idx = characterTextures.length-1;
    } else {
        idx--;
    }
    wrongTexture = true;
    setTexture(mainCharacter, characterTextures[idx]);
}

function saveTexture() {
    var newTexture = mainCharacter.textures.color;
    localUserInfo.texture = newTexture;
    var texMsg = new Msg("updateLook", localUserInfo.username, localUserInfo.id, newTexture, localUserInfo.roomName);
    sendMsg(texMsg);
    wrongTexture = false;
}

DOM.menu.look.nextBtn.addEventListener("click", nextTexture);
DOM.menu.look.backBtn.addEventListener("click", previousTexture);
DOM.menu.look.saveBtn.addEventListener("click", saveTexture);