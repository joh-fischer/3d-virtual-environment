var MSG = {
    // login stuff
    sendListOfUsernames: function(connection, v) {
        var msg = new Msg("listUsernames", "", "", v);
        this.sendMessage(connection, msg);
    },

    sendLoginVerification: function(connection, username, id, token, procedure) {
        var msg = new Msg("loginVerification", username, id, token, procedure);
        this.sendMessage(connection, msg);
    },

    sendRoomInfo: function(connection, characterData, charactersInRoom, msgHistory, friendsList) {
        var roomInfo = {
            texture: characterData.texture,
            position: characterData.position,
            rotation: characterData.rotation,
            roomName: characterData.roomName,
            charactersInRoom: charactersInRoom,
            msgHistory: msgHistory
        };
        if (friendsList)
            roomInfo.friendsList = friendsList;

        var msg = new Msg("roomInfo", "", "", roomInfo);
        this.sendMessage(connection, msg);
    },

    sendPrivateMsgHistory: function(connection, privateHistory) {
        var msg = new Msg("chatHistory", "", "", privateHistory);
        this.sendMessage(connection, msg);
    },

    sendNewMsgSigns: function(connection, newMsgSigns) {
        var msg = new Msg("newMsgSigns", "", "", newMsgSigns);
        this.sendMessage(connection, msg);
    },

    sendTransitionInfo: function(connection, transitionInfo) {
        var msg = new Msg("transitionInfo", "", "", transitionInfo);
        this.sendMessage(connection, msg);
    },

    sendAddCharacter: function(connection, username, characterData) {
        var msg = new Msg("addCharacter", username, "", characterData);
        this.sendMessage(connection, msg);
    },

    sendRemoveCharacter: function(connection, username) {
        var msg = new Msg("removeCharacter", username);
        this.sendMessage(connection, msg);
    },

    notifyAddCharacter: function(connections, username, characterData) {
        for (var idx in connections) {
            if (idx != username)
                this.sendAddCharacter(connections[idx], username, characterData);
        }
    },

    notifyRemoveCharacter: function(connections, username) {
        for (var idx in connections) {
            if (idx != username)
                this.sendRemoveCharacter(connections[idx], username);
        }
    },

    notifyChangeLook: function(connections, username, texture) {
        var msg = new Msg("updateLook", username, 0, texture);
        for (var idx in connections) {
            if (idx != username) 
                this.sendMessage(connections[idx], msg);
        }
    },

    sendTransitionNotification: function(connectionsByRoom, oldRoom, newRoom, username, characterData) {
        
        for (var idx in connectionsByRoom[oldRoom]) {
            this.sendRemoveCharacter(connectionsByRoom[oldRoom][idx], username);
        }
        for (var idx in connectionsByRoom[newRoom]) {
            if (idx != username)
                this.sendAddCharacter(connectionsByRoom[newRoom][idx], username, characterData);
        }
    },

    sendPWUpdateVerification: function(connection, token) {
        var msg = new Msg("pwVerification", "", "", token);
        this.sendMessage(connection, msg);
    },

    addFriend: function(connection, username) {
        var msg = new Msg("addFriend", "server", null, username);
        this.sendMessage( connection, msg );
    },

    deleteFriend: function(connection, username) {
        var msg = new Msg("deleteFriend", "server", null, username);
        this.sendMessage( connection, msg );
    },

    // messaging
    broadcastMsg: function(connections, msg) {
        for (var person in connections) {
            if (msg.username != person)
                connections[person].sendUTF( JSON.stringify( msg ));
        }
    },

    sendMessage: function(connection, msg) {
        connection.sendUTF( JSON.stringify( msg ));
    }
}

function Msg(type, username, id, content, goal, time) {
    this.type = type,
	this.username = username || null,
	this.id = id || null,
    this.content = content || null,
    this.goal = goal || null,
    this.time = time || null;    
}

module.exports = MSG;