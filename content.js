console.log('Hello from messenger extension!');

const backendUrl = 'http://192.168.0.101:4400';

let friendsCount = 0;
let friendList = [];
let tags = [];
let userAuthToken;

// Load user auth token and friendList
chrome.storage.sync.get(['userAuthToken', 'friendList', 'tags'], function(result) {
    console.log(result);
    userAuthToken = result.userAuthToken;
    if (userAuthToken != null && userAuthToken != '') {
        if (result.friendList != null)
            friendList = result.friendList;
        if (result.tags != null)
            tags = result.tags;
    }
});


let $chatBox = null;
let $chatList = null;

$(document).ready(() => {
    setTimeout(() => { start() }, 500);
});


// Message listener
chrome.runtime.onMessage.addListener(
    function(message, sender, sendResponse) {
        switch(message.action) {
            case "addTag":
                console.log('addTag');
                addTag(message.tag);
            break;
            case "logout":
                console.log('loggout');
                disableExtension();
            break;
            case "removeTag":
                console.log('removeTag');
                removeTag(message.tag);
            break;
            case "enableExtension": 
                console.log('Enable extension');
                userAuthToken = message.userAuthToken;
                friendList = message.friendList;
                tags = message.tags;
                start();
            break;
        }
    }
);


function start() {
    $chatBox = $('[aria-label="Conversation List"]');
    $chatList = $chatBox.find('li._5l-3 ._1qt5:not("._6zkd")');

    $chatBox.arrive('li._5l-3', function() {
        let item = $(this).find('._1qt5:not("._6zkd")');
        addSelectToFriend(item);
    });

    if (userAuthToken != null && userAuthToken != '') {
        $chatList.each(function() {
            addSelectToFriend($(this));
        });
    }
}


function addSelectToFriend(item) {
    let friendName = item.find('span').text();

    let flag = false;
    let options = ''
    for (let i = 0; i < friendList.length; i++) {
        options = '';
        if (friendList[i].name == friendName) {
            let tag = friendList[i].tag;
            for (let j = 0; j < tags.length; j++) {
                if (tags[j].name == tag) {
                    options += '<option selected>' + tags[j].name + '</option>';
                } else {  
                    options += '<option>' + tags[j].name + '</option>';
                }
            }
            appendSelectAndAddListener(item, options);
            flag = true;
            break;
        }
    }

    if (!flag) {
        for (let j = 0; j < tags.length; j++) {
            options += '<option>' + tags[j].name + '</option>';
        }
        appendSelectAndAddListener(item, options);
    }
}

function appendSelectAndAddListener(item, options) {
    item.html(item.html() + 
        `<select id="${friendsCount}" class="tag_select" style="width:100px;margin-right:4px;margin-left:4px;">
            <option>...</option>
            ${options}
        </select>`);

    // $('.tag_select').on('click', function(e) {
    //     e.stopPropagation();
    //     e.stopImmediatePropagation();
    //     console.log('click on select');
    // });

    $('.tag_select').on('change', function(e) {
        e.stopPropagation();
        e.stopImmediatePropagation();
        console.log('Change!!');
        let friendName = $(this).prev().text();
        let tag = $(this).val();
        console.log(friendName);

        if (tag == '...') {
            let index;
            for (let i = 0; i < friendList.length; i++) {
                if (friendList[i].name == friendName) {
                    index = i; 
                    break;
                }
            }
            friendList.splice(index, 1);
        } else {
            let flag = false;
            for (let k = 0; k < friendList.length; k++) {
                if (friendList[k].name == friendName) {
                    friendList[k].tag = tag;
                    flag = true;
                    break;
                }
            }
            if (!flag) friendList.push({ name: friendName, tag: tag });
        }
        chrome.storage.sync.set({ friendList });

        // Send data to background for saving to the server
        chrome.runtime.sendMessage({ type: 'addTagToFriend', friendName: friendName, tag: tag}); 
    });
}

function addTag(tag) {
    console.log(tag);
    $chatList = $chatBox.find('li._5l-3 ._1qt5:not("._6zkd")');
    $chatList.each(function() {
        let select = $(this).find('select');
        select.append(`<option>${tag}</option>`)
    });
}

function removeTag() {

}

function addTagToFriend(friendName, tag) {
    for (let i = 0; i < friends.length; i++) {

    }
}

function getFriendKey(friendName) {
    return friendName.trim().replace(/\ /g, '-');
}

function disableExtension() {
    $chatList.each(function() {
        $(this).find('select').remove();
    });
}