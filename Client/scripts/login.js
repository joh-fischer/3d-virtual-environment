var loginScreenVisible = true;


/* ERROR MESSAGES */
function msg_error(msg) {
    var failMsg = null;
    if (loginScreenVisible) {
        failMsg = DOM.login.failMsg;
        DOM.login.password.value = "";
    } else {
        failMsg = DOM.register.failMsg;
        DOM.register.password.value = "";
        DOM.register.passwordRepeat.value = "";
        DOM.register.password.style = "background-color: rgb(245,245,245);";
    }
    failMsg.innerText = msg;
    failMsg.style = "opacity:1;";
}

function msg_serverOffline() {
    serverOnline = false;
    DOM.login.failMsg.innerText = "Server offline! Please try again later...";
    DOM.login.failMsg.style = "opacity: 1;";
    DOM.register.failMsg.innerText = "Server offline! Please try again later...";
    DOM.register.failMsg.style = "opacity: 1;";
}

/* SENDING */
function sendLogin(evt) {
    if (evt.type == "keypress" && evt.key != "Enter") return;
    if (!serverOnline) return;
    if (DOM.login.password.value == "" || DOM.login.username.value == "") {
        msg_error("Something is missing...");
        return;
    }
    var loginMsg = new Msg("loginMsg", DOM.login.username.value, "", md5(DOM.login.password.value));
    console.log("SEND: ", loginMsg);    // debug
    
    wsClient.send( JSON.stringify(loginMsg) );
}

function sendRegister(evt) {
    if (evt.type == "keypress" && evt.key != "Enter") return;
    if (!serverOnline) return;
    if (DOM.register.password.value == "" || DOM.register.passwordRepeat.value == "" || DOM.register.username.value == "") {
        msg_error("Username or password missing...")
        return;
    }
    if (!usernameValid(DOM.register.username.value)) {
        msg_error("Username not available...")
        return;
    }
    if (!passwordValid(DOM.register.password.value)) {
        msg_error("Invalid password... Please choose another one");
        return;
    }
    if (DOM.register.password.value != DOM.register.passwordRepeat.value) {
        msg_error("Passwords differ!");
        return;
    }
    var registerMsg = new Msg("registerMsg", DOM.register.username.value, "", md5(DOM.register.password.value) );
    
    console.log("SEND: ", registerMsg);    // debug
    
    wsClient.send( JSON.stringify(registerMsg) );
}

/* TRANSITIONS */
function transitToWorld() {
    DOM.loginScreen.style = "display: none;";
    DOM.virtualWorld.style = "display: initial;";

    var startingRoom = world[localUserInfo.roomName];

    changeRoom(startingRoom);

    loop();
}

function transitToRegister() {
    if (loginScreenVisible) {
        loginScreenVisible = false;
        // change to register form
        DOM.header.innerText = "Registration";
        DOM.loginRegisterLink.innerText = "Login";
        if (serverOnline)
            DOM.login.failMsg.style = "opacity: 0;";
        DOM.login.password.value = "";
        DOM.login.username.value = "";
        DOM.login.form.style = "display: none;"
        DOM.register.form.style = "display: initial;"
    } else {
        loginScreenVisible = true;
        // change to login form
        DOM.header.innerText = "Login";
        DOM.loginRegisterLink.innerText = "Register";
        if (serverOnline)
            DOM.register.failMsg.style = "opacity: 0;";
        DOM.register.username.value = "";
        DOM.register.password.value = "";
        DOM.register.passwordRepeat.value = "";
        DOM.register.form.style = "display: none;";
        DOM.login.form.style = "display: initial;";
    }
}


/* REGISTER */
function usernameValid(username) {
    if (username.length < 2 || username.length > 12) return false;
    if (usernamesFromServer.includes(username)) return false;
    if (/\s/.test(username)) return false;
    if (/!/.test(username)) return false;
    if (username[0] <= '9' && username[0] >= '0') return false;
    
    return true;
}

function checkUsername() {
    var username = DOM.register.username;
    if (username.value.length == 0) {
        username.style = "background-color: rgb(245,245,245);";
    } else if (!usernameValid(username.value)) {
        username.style = "background-color: red;";
    } else {
        username.style = "background-color: green;";
    }
}

function passwordValid(password) {
    if (password.length < 4) return false;
    if (/\s/.test(password)) return false;
    return true;
}

function checkPassword() {
    var password = DOM.register.password;
    if (password.value.length == 0) {
        password.style = "background-color: rgb(245,245,245);";
    } else if (!passwordValid(password.value)) {
        password.style = "background-color: red;";
    } else {
        password.style = "background-color: rgb(245,245,245);";
    }
}


/* EVENT LISTENERS */
DOM.login.button.addEventListener("click", sendLogin);
DOM.login.password.addEventListener("keypress", sendLogin);

DOM.register.button.addEventListener("click", sendRegister);
DOM.register.passwordRepeat.addEventListener("keypress", sendRegister);

DOM.loginRegisterLink.addEventListener("click", transitToRegister);

DOM.register.username.addEventListener("input", checkUsername);
DOM.register.password.addEventListener("input", checkPassword);
