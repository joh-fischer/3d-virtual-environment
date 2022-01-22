function $(query) {
    return document.querySelector(query);
}

var DOM = {
    
    connectScreen: $(".connect-screen"),
    
    loginScreen: $(".login-screen"),
    
    virtualWorld: $(".virtual-world"),

    canvas: $("#the-world"),
    
    loginRegisterLink: $("#login-register-link"),
    
    header: $("#header"),
    
    login: {
        username: $("#username-input"),
        password: $("#password-input"),
        failMsg: $("#login-failed"),
        button: $("#login-button"),
        form: $(".login"),
    },
    
    register: {
        username: $("#choose-username-input"),
        password: $("#choose-password-input"),
        passwordRepeat: $("#repeat-password-input"),
        failMsg: $("#register-failed"),
        button: $("#register-button"),
        form: $(".register")
    },
    
    canvas: $("#the-world"),
    
    menu: {
        general: {
            button: $("#general-button"),
            active: false,
            window: $(".general-chat"),
            msgs: $(".general-chat .messages"),
            msgInput: $(".general-chat #msg-input-general"),
            sendButton: $(".general-chat #send-button"),
            newMsg: $(".menu #general-button span")
        },
        friends: {
            list: {
                button: $("#hide-friends-list-btn"),
                window: $(".friends-list"),
                entries: $(".friends-entries"),
                active: true,
                hiddenEntries: $(".friends-entries-hidden")
            },
            chat: {
                window: $(".friends-chat"),
                msgs: $(".friends-chat .messages"),
                msgInput: $(".friends-chat #msg-input"),
                sendButton: $(".friends-chat #send-button"),
            },
            newMsg: $(".menu #friends-button span"),
            button: $("#friends-button"),
            active: false,
            window: $(".friends"),
            activeFriend: null,
            activeChat: $(".friends-chat .messages-selected")
        },
        look: {
            button: $("#look-button"),
            active: false,
            window: $(".look"),
            nextBtn: $("#look-next-button"),
            backBtn: $("#look-back-button"),
            saveBtn: $("#look-save-button"),
        },
        settings: {
            button: $("#settings-button"),
            active: false,
            window: $(".settings"),
            oldPW: $("#settings-old-pw"),
            newPW: $("#settings-new-pw"),
            newPWRepeat: $("#settings-new-pw-repeat"),
            changeButton: $("#change-pw-button"),
            failMsg: $("#pw-change-failed")
        },
        logout: {
            button: $("#logout-button")
        }
    },

    art: {
        active: false,
        window: $(".art-info"),
        header: $("#art-header"),
        text: $("#art-text")
    },
    
    uploadImg: {
        active: false,
        window: $(".upload-img"),
        fileupload: $("#fileupload"),
        uploadCanvas: $("#upload-canvas"),
        template: $(".sample-canvas")
    },

    templates: {
        message: $("#templates .message"),
        messageWindow: $("#templates .messages"),
        friendsEntry: $("#templates .friends-entry"),
    }
};

var debug = false;
var run_loop = true;