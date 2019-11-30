console.log('Hello from popup!');

const backendUrl = 'http://192.168.0.102:4400';
const colors = ['#fa697c', '#10316b', '#94aa2a', '#fc7fb2', '#888888', '#c71c56', '#a25016', '	#6a3577',
                '#005b96 ', '#451e3e', '#f37736', '#ffa700', '#03dac6', '#F50057', '#6A1B9A', '#006064',
                '#009688', '#9CCC65', '#827717', '#C0CA33', '#76FF03', '#F57F17', '#FFA726', '#FF5722',
                '#6D4C41', '#424242', '#78909C'];


$signupBox = $('.signup_box');
$loginBox = $('.login_box');
$mainContentBox = $('.main_content');

// Display signup section
function openSignup() {
    $signupBox.css('display', 'block');
    $loginBox.css('display', 'none');
    $mainContentBox.css('display', 'none');
}

// Display login section
function openLogin() {
    $signupBox.css('display', 'none');
    $loginBox.css('display', 'block');
    $mainContentBox.css('display', 'none');
}

// Diaplay main section ehen user is loggged in
function openMain() {
    $signupBox.css('display', 'none');
    $loginBox.css('display', 'none');
    $mainContentBox.css('display', 'block');
}

// Get the user authToken
let userAuthToken = '';
chrome.storage.sync.get(['userAuthToken'], function(result) {
    authToken = result.userAuthToken;
    if (authToken == null || authToken == '') openSignup(); // Not logged in
    else {
        // Logged in
        openMain();
        userAuthToken = authToken;
    }
});


$('.go_to_signup').click(() => {
    openSignup();
});

$('.go_to_login').click(() => {
    openLogin();
});


let tags = [];
let friendList = [];
let lastTagOpened = '';
let templates = [];
let messages = [];

function generateKey(str) {
    return str.replace(/ /g, '-');
}

let storageKeys = ['tags', 'friendList', 'lastTagOpened', 'templates', 'messages'];

// Initialize popup. Get tags and friendList from storage
chrome.storage.sync.get(storageKeys, function(result) {
    if (result.tags != null)
        tags = result.tags;
    if (result.friendList != null)
        friendList = result.friendList;
    if (result.lastTagOpened != null)
        lastTagOpened = result.lastTagOpened;
    if (result.templates != null)
        templates = result.templates;
    // if (result.messages != null)
    //     messages = result.messages;

    let k = [];
    for (let i = 0; i < templates.length; i++) {
        k.push(generateKey(templates[i]));
    }
    chrome.storage.sync.get(k, function(r) {
        for (let i = 0; i < templates.length; i++) {
            let key = generateKey(templates[i]);
            if (r[key] != null) {
                messages[key] = r[key];
            }
        }
    });
    
    // Add all saved tags to the popup
    addTags();
    if (lastTagOpened != null && lastTagOpened != '')
        setTagFriendList(lastTagOpened);
    setTemplates();
});

function addTags() {
    $tagBox = $('.tag_box');
    tagHtml = '';
    for (let i = 0; i < tags.length; i++) {
        tagHtml += `
            <div class="tag_item" style="background:${tags[i].color}">
                <div class="tag_value" style="inline-block;">${tags[i].name}</div>
                <div class="tag_remove" style="display:inline-block;margin-left:10px;">x</div>
            </div>`;
    }
    $tagBox.append(tagHtml);
}

function setTemplates() {
    console.log(templates);
    for (let i = 0; i < templates.length; i++) {
        $('.templates').append(
            `<div class="template" style="display:flex;justify-content:space-between;">
                <div class="template_value" style="cursor:pointer;">${templates[i]}</div>
                <div class="each_template_action" style="margin-right:10px;cursor:pointer;">
                    <img class="logo delete_template" src="./images/delete.png">
                </div>
            </div>`
        );
    }

    $('.save_template').css({
        'pointer-events': 'none',
        'background': 'rgb(3, 166, 133, .5)'
    });
    $('.cancel_template').css({
        'pointer-events': 'none',
        'background': 'rgb(3, 166, 133, .5)'
    });
}


// Signup form action
$('#signup_form').submit(function(e) {
    e.preventDefault();

    let formData = {
        email: $('#email_signup').val(),
        password: $('#password_signup').val(),
    };

    if (formData.password != $('#confirm_password_signup')) {
        console.log('password does not match confirm password');
        return;
    }

    $.ajax({
        type: 'POST',
        url: backendUrl + '/api/user/signup',
        data: formData,
        success: function(data, textStatus, request) {
            // Save auth token required for further requests
            const authToken = request.getResponseHeader('x-user-auth-token');
            userAuthToken = authToken;
            chrome.storage.sync.set({userAuthToken: authToken}, function() {
                openMain();
                // Empty input fields
                $('#email_signup').val('');
                $('#password_signup').val('');
            });
            loadDataFromServer();
        },
        error: function (request, textStatus, errorThrown) {
            console.log('Error signing up');
        }
    })
});


// Login form action
$('#login_form').submit(function(e) {
    e.preventDefault();

    let formData = {
        email: $('#email_login').val(),
        password: $('#password_login').val(),
    };

    $.ajax({
        type: 'POST',
        url:backendUrl + '/api/user/login',
        data: formData,
        success: function(data, textStatus, request) {
            // Save auth token required for further requests
            const authToken = request.getResponseHeader('x-user-auth-token');
            userAuthToken = authToken;
            chrome.storage.sync.set({userAuthToken: authToken}, function() {
                openMain();
                // Empty input fields
                $('#email_login').val('');
                $('#password_login').val('');
            });
            loadDataFromServer();
        },
        error: function (request, textStatus, errorThrown) {
            console.log('Error signing up');
        }
    });
});


function loadDataFromServer() {
    // Get all the tags
    $.ajax({
        type: 'POST',
        url: backendUrl + '/api/user/getAllTagsAndFriendList',
        beforeSend: function(request) {
            request.setRequestHeader("x-user-auth-token", userAuthToken);
        },
        success: function(data, textStatus, request) {
            tags = data.data.tags;
            // Save tags to storage
            chrome.storage.sync.set({ tags });
            
            // Add tags to popup html
            addTags();

            friendList = data.data.friends;
            // TODO: save friend list to storage
            chrome.storage.sync.set({ friendList, messages: data.data.messages });

            // Enable extension
            chrome.tabs.getAllInWindow(null, function(tabs) {
                // Find messenger tab
                for (let i = 0; i < tabs.length; i++) {
                    if (tabs[i].title == 'Messenger') {
                        chrome.tabs.sendMessage(tabs[i].id, { 
                            action: 'enableExtension',
                            userAuthToken: userAuthToken,
                            tags: tags,
                            friendList: friendList,
                            
                        });
                        break;
                    }                        
                }
            });
        },
        error: function (request, textStatus, errorThrown) {
            console.log('Error loading data from server');
        }
    });
}


// new tag form submit
$('#add_tag_form').submit(function(e) {
    e.preventDefault();
    $tagBox = $('.tag_box');
    $tagInput = $('#tag_input');
    tag = $tagInput.val(); // Tag value

    // Cheack if tag is alredy present
    for (let i = 0; i < tags.length; i++) {
        if (tags[i] == tag) {
            console.log('Tag already present');
            return;
        }
    }

    // Get aa random color for the tag
    let r = Math.floor(Math.random() * colors.length);
    console.log(r);
    let color = colors[r];
    console.log(color);

    // Tag not present so add to the tags array
    tags.push({ name: tag, color: color });

    // Add tag to popup
    $tagBox.append(`<div class="tag_item" style="background:${color}">
                        <div class="tag_value" style="inline-block;">${tag}</div>
                        <div class="tag_remove" style="display:inline-block;margin-left:10px;">x</div>
                    </div>`);
    // Reset tag input field to blank
    $tagInput.val('');

    //Add tag to the server database
    $.ajax({
        type: 'POST',
        url: backendUrl + '/api/user/addTag',
        data: {
            name: tag,
            color: color,
        },
        beforeSend: function(request) {
            request.setRequestHeader("x-user-auth-token", userAuthToken);
        },
        success: function(data, textStatus, request) { },
        error: function (request, textStatus, errorThrown) {
            console.log('Error signing up');
        }
    });

    // Save the tag to local stoarge
    chrome.storage.sync.set({ tags });

    // Send tag to mesenger content.js for adding option tag to the select tag
    chrome.tabs.getAllInWindow(null, function(tabs) {
        // Find messenger tab
        for (let i = 0; i < tabs.length; i++) {
            if (tabs[i].title == 'Messenger') {
                chrome.tabs.sendMessage(tabs[i].id, { action: 'addTag', tag, color });
                break;
            }                        
        }
    });
});

// Rempve tag
$('.tag_box').on('click', '.tag_remove', function(e) {
    console.log('remove');
    e.stopPropagation();
    e.stopImmediatePropagation();

    let $parent = $(this).parent();
    let tag = $parent.find('.tag_value').text().trim();
    $parent.remove();

    chrome.storage.sync.get('lastTagOpened', function(result) {
        if (result.lastTagOpened == tag) {
            $('.tag_friend_box').html(
                `<div style="font-weight:14px;font-weight:bold;">
                    No contacts available
                </div>`
            );
            $('.messages').html('');
            $('.notes').html('');

            chrome.storage.sync.set({ lastTagOpened: '' });
        }
    });

    //Remove tag from the server database
    $.ajax({
        type: 'POST',
        url: backendUrl + '/api/user/removeTag',
        data: {
            name: tag,
        },
        beforeSend: function(request) {
            request.setRequestHeader("x-user-auth-token", userAuthToken);
        },
        success: function(data, textStatus, request) { },
        error: function (request, textStatus, errorThrown) {
            console.log('Error removing tag');
        }
    });

    
    // Find and remove tag from tag array
    for (let i = 0; i < tags.length; i++) {
        if (tags[i].name == tag) {
            tags.splice(i, 1);
            break;
        }
    }

    // Save the tag to local stoarge
    chrome.storage.sync.set({ tags });

    // 
    chrome.tabs.getAllInWindow(null, function(tabs) {
        // Find messenger tab
        for (let i = 0; i < tabs.length; i++) {
            if (tabs[i].title == 'Messenger') {
                chrome.tabs.sendMessage(tabs[i].id, { action: 'removeTag', tag, tags });
                break;
            }                        
        }
    });
});


$('.tag_box').on('click', '.tag_value', function(e) {
    console.log('tag value selected');
    e.stopPropagation();
    e.stopImmediatePropagation();

    let tag = $(this).text();
    chrome.storage.sync.get('lastTagOpened', function(result) {
        if (result.lastTagOpened != tag) {
            chrome.storage.sync.set({ lastTagOpened: tag });

            $('.note_box').css('display', 'none');
            $('.template_box').css('display', 'block');

            setTagFriendList(tag);

            $('.add_template').css({
                'pointer-events': 'auto',
                'background': 'rgb(3, 166, 133)'
            });
        }
    });
});


function setTagFriendList(tag) {
    let buttonStyle = 'cursor:pointer;font-size:14px;padding:5px 16px;border-radius:16px;background:blue;color:white;';
    let friends = [];
    let friendHtml = '';
    
    let count = 0;
    console.log(friendList);
    for (let i = 0; i < friendList.length; i++) {
        if (friendList[i].tag == tag) {
            friends.push(friendList[i]);
            friendHtml +=   
                `<div class="tag_friend_item" style="display:flex;">
                    <div class="friend_image" style="width:55px;height:55px;background:grey;border-radius:50%;overflow:hidden;">
                        <img style="width:100%;height:100%;" src="${friendList[i].imageUrl}">
                    </div>
                    <div class="friend_detail" style="margin-left:16px;">
                        <div class="friend_name" style="margin-top:2px;margin-bottom:8px;">${friendList[i].name}</div>
                        <div class="friend_action" style="display:flex;">
                            <div class="friend_chat" style="${buttonStyle}margin-right:16px;">Chat</div>
                            <div class="friend_note" style="${buttonStyle}">Note</div>
                        </div>
                    </div>
                </div>`;
            count++;
        }
    }

    if (count > 0) {
        friendHtml = 
            `<div style="font-weight:14px;font-weight:bold;">Contacts for 
                <span style="font-style:italic">'${tag}'</span>
            </div>` + friendHtml;
    } else {
        friendHtml = 
            `<div style="font-weight:14px;font-weight:bold;">No contacts available for 
                <span style="font-style:italic">'${tag}'</span>
            </div>` + friendHtml;
    }

    $friendBox = $('.tag_friend_box');
    $friendBox.html(friendHtml);
}


$('.tag_friend_box').on('click', '.friend_chat', function(e) {
    e.stopPropagation();
    e.stopImmediatePropagation();

    let friendName = $(this).parent().prev().text();

    $('.tag_friend_item').removeClass('friend_active');
    $(this).parent().parent().parent().addClass('friend_active');

    // Send message to content.js to disable the extension
    chrome.tabs.getAllInWindow(null, function(tabs) {
        for (let i = 0; i < tabs.length; i++) {
            // Find messenger tab
            if (tabs[i].title == 'Messenger') {
                chrome.tabs.sendMessage(tabs[i].id, { action: 'selectFriend', friendName });
                break;
            }               
        }
    });
});

$('.tag_friend_box').on('click', '.friend_note', function(e) {
    console.log('note');
    e.stopPropagation();
    e.stopImmediatePropagation();

    $('.nav_template').removeClass('nav_item_selected').addClass('nav_item_unselected');
    $('.nav_message').removeClass('nav_item_selected').addClass('nav_item_unselected');
    $('.nav_note').removeClass('nav_item_unselected').addClass('nav_item_selected');
    $('.template_box').css('display', 'none');
    $('.message_box').css('display', 'none');
    $('.note_box').css('display', 'block');
    $('.nav_template').css('cursor', 'pointer');
    $('.nav_message').css('cursor', 'pointer');

    let friendName = $(this).parent().prev().text();

    $('.tag_friend_item').removeClass('friend_active');
    $(this).parent().parent().parent().addClass('friend_active');

    for (let i = 0; i < friendList.length; i++) {
        if (friendList[i].name == friendName) {
            let notes = friendList[i].notes;
            let notesHtml = `<div style="margin-top:8px;font-style:italic;display:none;">Make notes for 
                                <span class="current_friend">${friendName}</span>
                            </div>`;
            if (notes != null) {
                for (let j = 0; j < notes.length; j++) {
                    notesHtml += 
                        `<div class="note" style="display:flex;justify-content:space-between;">
                            <div class="note_value">${notes[j]}</div>
                            <div class="each_note_action send" style="margin-right:10px;cursor:pointer;"></div>
                        </div>`;
                }
            }
            $('.note_box .notes').html(notesHtml);
            break;
        }
    }

    $('.add_note').css({
        'pointer-events': 'auto',
        'background': 'rgb(3, 166, 133)'
    });
    $('.save_note').css({
        'pointer-events': 'none',
        'background': 'rgb(3, 166, 133, .5)'
    });
    $('.cancel_note').css({
        'pointer-events': 'note',
        'background': 'rgb(3, 166, 133, .5)'
    });
});

$('.note_box').on('click', '.add_note', function(e) {
    console.log('add note');
    e.stopPropagation();
    e.stopImmediatePropagation();

    //$notes = $(this).parent().prev();
    $('.notes').append(`<textarea class="note_textarea" rows="4"></textarea>`);
    $('.note_textarea').focus();
    $('.notes').scrollTop($('.notes').height());
    $(this).css({
        'pointer-events': 'none',
        'background': 'rgb(3, 166, 133, .5)'
    });
    $('.save_note').css({
        'pointer-events': 'auto',
        'background': 'rgb(3, 166, 133)'
    });
    $('.cancel_note').css({
        'pointer-events': 'auto',
        'background': 'rgb(3, 166, 133)'
    });
});

$('.note_box').on('click', '.save_note', function(e) {
    console.log('save note');
    e.stopPropagation();
    e.stopImmediatePropagation();

    let note = $('.note_textarea').val();
    let friendName = $('.current_friend').text();
    $('.note_textarea').remove();
    $('.notes').append(`<div class="note" style="display:flex;justify-content:space-between;">
                            <div class="note_value">${note}</div>
                            <div class="each_note_action send" style="margin-right:10px;cursor:pointer;"></div>
                        </div>`);

    for (let i = 0; i < friendList.length; i++) {
        if (friendList[i].name == friendName) {
            if (friendList[i].notes == null) {
                friendList[i].notes = [];
                friendList[i].notes.push(note);
            } else {
                friendList[i].notes.push(note);
            }
            break;
        }
    }

    chrome.storage.sync.set({ friendList });

    $('.add_note').css({
        'pointer-events': 'auto',
        'background': 'rgb(3, 166, 133)'
    });
    $('.save_note').css({
        'pointer-events': 'none',
        'background': 'rgb(3, 166, 133, .5)'
    });
    $('.cancel_note').css({
        'pointer-events': 'none',
        'background': 'rgb(3, 166, 133, .5)'
    });

    $.ajax({
        type: 'POST',
        url: backendUrl + '/api/user/addNoteToFriend',
        data: {
            friendName,
            note,
        },
        beforeSend: function(request) {
            request.setRequestHeader("x-user-auth-token", userAuthToken);
        },
        success: function(data, textStatus, request) {
            
        },
        error: function (request, textStatus, errorThrown) {
            console.log('Error adding note to friend');
        }
    });
});

$('.note_box').on('click', '.cancel_note', function() {
    console.log('cancel note');

    $('.notes').find('textarea').remove();
    $('.add_note').css({
        'pointer-events': 'auto',
        'background': 'rgb(3, 166, 133)'
    });
    $('.save_note').css({
        'pointer-events': 'none',
        'background': 'rgb(3, 166, 133, .5)'
    });
    $('.cancel_note').css({
        'pointer-events': 'none',
        'background': 'rgb(3, 166, 133, .5)'
    });
});

$('.message_box').on('click', '.send_message', function(e) {
    e.stopPropagation();
    e.stopImmediatePropagation();

    let message = $(this).parent().prev().text();
    console.log(message);

    // Send message to content.js to disable the extension
    chrome.tabs.getAllInWindow(null, function(tabs) {
        for (let i = 0; i < tabs.length; i++) {
            // Find messenger tab
            if (tabs[i].title == 'Messenger') {
                chrome.tabs.sendMessage(tabs[i].id, { action: 'sendMessage', message });
                break;
            }               
        }
    });
});

$('.message_box').on('click', '.delete_message', function(e) {
    console.log('delete message');
    e.stopPropagation();
    e.stopImmediatePropagation();

    let template = $('.messages').find('.template_name').text();
    let key = generateKey(template);

    let message = $(this).parent().prev().text();
    $(this).parent().parent().remove();
    for (let i = 0; i < messages[key].length; i++) {
        if (messages[key][i] == message) {
            messages[key].splice(i, 1);
            break;
        }
    }

    let storageObj = {};
    storageObj[key] = messages[key];
    chrome.storage.sync.set(storageObj);
});

$('.nav_template').on('click', function(e) {
    console.log('nav_template clicked');
    $('.nav_template').removeClass('nav_item_unselected').addClass('nav_item_selected');
    $('.nav_note').removeClass('nav_item_selected').addClass('nav_item_unselected');
    $('.template_box').css('display', 'block');
    $('.note_box').css('display', 'none');
    $('.nav_template').css('cursor', 'auto');
});

$('.nav_message_menu').on('click', function(e) {
    console.log('nav_messsage clicked');
    $('.nav_message').removeClass('nav_item_unselected').addClass('nav_item_selected');
    $('.nav_note').removeClass('nav_item_selected').addClass('nav_item_unselected');
    $('.message_box').css('display', 'block');
    $('.note_box').css('display', 'none');
    $('.nav_message').css('cursor', 'auto');
});

$('.message_box').on('click', '.add_message', function(e) {
    console.log('add message');
    e.stopPropagation();
    e.stopImmediatePropagation();

    //$notes = $(this).parent().prev();
    $('.messages').append(`<textarea class="message_textarea" placeholder="New message" rows="1"></textarea>`);
    $('.message_textarea').focus();
    $('.messages').scrollTop($('.messages').height());
    $(this).css({
        'pointer-events': 'none',
        'background': 'rgb(3, 166, 133, .5)'
    });
    $('.save_message').css({
        'pointer-events': 'auto',
        'background': 'rgb(3, 166, 133)'
    });
    $('.cancel_message').css({
        'pointer-events': 'auto',
        'background': 'rgb(3, 166, 133)'
    });
});

$('.message_box').on('click', '.save_message', function(e) {
    console.log('save message');
    e.stopPropagation();
    e.stopImmediatePropagation();

    let message = $('.message_textarea').val();
    $('.message_textarea').remove();
    $('.messages').append(
        `<div class="message" style="display:flex;justify-content:space-between;">
            <div class="message_value">${message}</div>
            <div class="each_message_action" style="margin-right:10px;cursor:pointer;">
                <img class="logo send_message" src="./images/send.png">
                <img class="logo delete_message" src="./images/delete.png">
            </div>
        </div>`
    );

    let template = $('.messages').find('.template_name').text();
    console.log('template', templates);
    let key = generateKey(template)
    if (messages[key] == null) messages[key] = [];
    messages[key].push(message);
    console.log(messages);
    let storageObj = {};
    storageObj[key] = messages[key];
    console.log(storageObj);
    chrome.storage.sync.set(storageObj);

    $('.add_message').css({
        'pointer-events': 'auto',
        'background': 'rgb(3, 166, 133)'
    });
    $('.save_message').css({
        'pointer-events': 'none',
        'background': 'rgb(3, 166, 133, .5)'
    });
    $('.cancel_message').css({
        'pointer-events': 'none',
        'background': 'rgb(3, 166, 133, .5)'
    });

    // Send message to content.js to disable the extension
    chrome.tabs.getAllInWindow(null, function(tabs) {
        for (let i = 0; i < tabs.length; i++) {
            // Find messenger tab
            if (tabs[i].title == 'Messenger') {
                chrome.tabs.sendMessage(tabs[i].id, { action: 'newMessage', template, message });
                break;
            }                        
        }
    });

    // $.ajax({
    //     type: 'POST',
    //     url: backendUrl + '/api/user/addMessage',
    //     data: {
    //         template, 
    //         message,
    //     },
    //     beforeSend: function(request) {
    //         request.setRequestHeader("x-user-auth-token", userAuthToken);
    //     },
    //     success: function(data, textStatus, request) {
    //         console.log(data.data);    
    //     },
    //     error: function (request, textStatus, errorThrown) {
    //         console.log('Error adding message to friend');
    //     }
    // })
});

$('.message_box').on('click', '.cancel_message', function(e) {
    console.log('cancel message');

    $('.messages').find('textarea').remove();
    $('.add_message').css({
        'pointer-events': 'auto',
        'background': 'rgb(3, 166, 133)'
    });
    $('.save_message').css({
        'pointer-events': 'none',
        'background': 'rgb(3, 166, 133, .5)'
    });
    $('.cancel_message').css({
        'pointer-events': 'none',
        'background': 'rgb(3, 166, 133, .5)'
    });
});

$('.go_to_template').on('click', function(e) {
    console.log('back to template');
    e.stopPropagation();
    e.stopImmediatePropagation();

    if ($('.nav_message').hasClass('nav_item_selected')) {
        $('.nav_template').removeClass('nav_item_unselected').addClass('nav_item_selected');
        $('.nav_message').css('display', 'none');
        $('.message_box').css('display', 'none');
        $('.messages').html('');
        $('.nav_template').css('display', 'block');
        $('.template_box').css('display', 'block');
    }
}); 

$('.template_box').on('click', '.template_value', function(e) {
    console.log('template value clicked');
    e.stopPropagation();
    e.stopImmediatePropagation();

    let template = $(this).text();

    
    $('.nav_template').css('display', 'none');
    $('.template_box').css('display', 'none');
    $('.nav_message').css('display', 'flex');
    $('.message_box').css('display', 'block');
    $('.nav_message').removeClass('nav_item_unselected').addClass('nav_item_selected');

    let templateMessage = messages[generateKey(template)] || [];
    console.log(templateMessage);

    $('.messages').append(`<div class="template_name" style="display:none;">${template}</div>`);

    let templateMessageHtml = '';
    for (let i = 0; i < templateMessage.length; i++) {
        templateMessageHtml += 
        `<div class="message" style="display:flex;justify-content:space-between;">
            <div class="message_value">${templateMessage[i]}</div>
            <div class="each_message_action" style="margin-right:10px;cursor:pointer;">
                <img class="logo send_message" src="./images/send.png">
                <img class="logo delete_message" src="./images/delete.png">
            </div>
        </div>`;
    }

    $('.messages').append(templateMessageHtml);

    $('.save_message').css({
        'pointer-events': 'none',
        'background': 'rgb(3, 166, 133, .5)'
    });
    $('.cancel_message').css({
        'pointer-events': 'none',
        'background': 'rgb(3, 166, 133, .5)'
    });
});

$('.template_box').on('click', '.add_template', function(e) {
    console.log('add template');

    $('.templates').append(`<textarea class="template_textarea" placeholder="New template" rows="1"></textarea>`);
    $('.template_textarea').focus();
    $('.templates').scrollTop($('.templates').height());
    $(this).css({
        'pointer-events': 'none',
        'background': 'rgb(3, 166, 133, .5)'
    });
    $('.save_template').css({
        'pointer-events': 'auto',
        'background': 'rgb(3, 166, 133)'
    });
    $('.cancel_template').css({
        'pointer-events': 'auto',
        'background': 'rgb(3, 166, 133)'
    });
});

$('.template_box').on('click', '.save_template', function(e) {
    console.log('save template');
    e.stopPropagation();
    e.stopImmediatePropagation();

    let template = $('.template_textarea').val();
    for (let i = 0; i < templates.length; i++) {
        if (templates[i] == template) {
            console.log('Template with this name already present.');
            return;
        }
    }

    $('.template_textarea').remove();
    $('.templates').append(
        `<div class="template" style="display:flex;justify-content:space-between;">
            <div class="template_value" style="cursor:pointer;">${template}</div>
            <div class="each_template_action" style="margin-right:10px;cursor:pointer;">
                <img class="logo delete_template" src="./images/delete.png">
            </div>
        </div>`
    );

    templates.push(template);

    chrome.storage.sync.set({ templates });

    $('.add_template').css({
        'pointer-events': 'auto',
        'background': 'rgb(3, 166, 133)'
    });
    $('.save_template').css({
        'pointer-events': 'none',
        'background': 'rgb(3, 166, 133, .5)'
    });
    $('.cancel_template').css({
        'pointer-events': 'none',
        'background': 'rgb(3, 166, 133, .5)'
    });

    // Send message to content.js to disable the extension
    chrome.tabs.getAllInWindow(null, function(tabs) {
        for (let i = 0; i < tabs.length; i++) {
            // Find messenger tab
            if (tabs[i].title == 'Messenger') {
                chrome.tabs.sendMessage(tabs[i].id, { action: 'newTemplate', template });
                break;
            }                        
        }
    });

    // $.ajax({
    //     type: 'POST',
    //     url: backendUrl + '/api/user/addTemplate',
    //     data: { template },
    //     beforeSend: function(request) {
    //         request.setRequestHeader("x-user-auth-token", userAuthToken);
    //     },
    //     success: function(data, textStatus, request) {
    //         console.log(data.data);
    //     },
    //     error: function (request, textStatus, errorThrown) {
    //         console.log('Error adding template to friend');
    //     }
    // })
});

$('.template_box').on('click', '.cancel_template', function(e) {
    console.log('cancel template');

    $('.templates').find('textarea').remove();
    $('.add_template').css({
        'pointer-events': 'auto',
        'background': 'rgb(3, 166, 133)'
    });
    $('.save_template').css({
        'pointer-events': 'none',
        'background': 'rgb(3, 166, 133, .5)'
    });
    $('.cancel_template').css({
        'pointer-events': 'none',
        'background': 'rgb(3, 166, 133, .5)'
    });
});

$('.template_box').on('click', '.delete_template', function(e) {
    console.log('delete template');
    e.stopPropagation();
    e.stopImmediatePropagation();

    let template = $(this).parent().prev().text();
    $(this).parent().parent().remove();
    for (let i = 0; i < templates.length; i++) {
        if (templates[i] == template) {
            templates.splice(i, 1);
            break;
        }
    }

    chrome.storage.sync.set({ templates });
});

$('body').on('input', 'textarea', function() {
    console.log('input...');
    this.style.height = 'auto';
    this.style.height = (this.scrollHeight) + 'px';
});


// Logout button action
$('.logout_box').click(() => {
    // Clear all storage data and oprn login form

    chrome.storage.sync.clear(function(result) {
        $('.tag_box').html('');
        openLogin();

        // Send message to content.js to disable the extension
        chrome.tabs.getAllInWindow(null, function(tabs) {
            for (let i = 0; i < tabs.length; i++) {
                // Find messenger tab
                if (tabs[i].title == 'Messenger') {
                    chrome.tabs.sendMessage(tabs[i].id, { action: 'logout' });
                    break;
                }                        
            }
        });
    });
});