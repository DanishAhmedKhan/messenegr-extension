console.log('Hello from popup!');

//const backendUrl = 'http://localhost:3000';
//const backendUrl = 'http://13.232.210.23:4400';
//const backendUrl = 'http://ec2-13-232-210-23.ap-south-1.compute.amazonaws.com:4400';
const backendUrl = 'https://ahmerraza.com';

// Radom colors for tag
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
chrome.storage.local.get(['userAuthToken'], function(result) {
    authToken = result.userAuthToken;
    if (authToken == null || authToken == '') openLogin(); // Not logged in
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
let editTagIndex = -1;
let friendList = [];
let lastTagOpened = '';
let templates = [];
let messages = [];
let sideBox = true;

function generateKey(str) {
    return str.replace(/ /g, '-');
}

let storageKeys = ['tags', 'sideBox', 'friendList', 'lastTagOpened', 'templates', 'messages'];

// Initialize popup. Get tags and friendList from storage
chrome.storage.local.get(storageKeys, function(result) {
    if (result.tags != null)
        tags = result.tags;
    if (result.sideBox != null)
        sideBox = result.sideBox;
    if (result.friendList != null)
        friendList = result.friendList;
    if (result.lastTagOpened != null)
        lastTagOpened = result.lastTagOpened;
    if (result.templates != null)
        templates = result.templates;
    
    cleanFeiendList();
    console.log(tags);

    let k = [];
    for (let i = 0; i < templates.length; i++) {
        k.push(generateKey(templates[i]));
    }
    chrome.storage.local.get(k, function(r) {
        for (let i = 0; i < templates.length; i++) {
            let key = generateKey(templates[i]);
            if (r[key] != null) {
                messages[key] = r[key];
            }
        }
    });

    // Add all saved tags to the popup
    setSelectCheckbox();
    addTags();
    if (lastTagOpened == null) lastTagOpened = '---';
    setTagFriendList(lastTagOpened);
    setTemplates();

    imageSendSetup();
});

function cleanFeiendList() {
    for (let i = 0; i < friendList.length; i++) {
        let tag = friendList[i].tag;
        //console.log(friendList[i].name, tag, i);
        if (friendList)
        if (tag == '...') {
            friendList.splice(i, 1);
            i--;
            //console.log('assasa');
        } else {
            let flag = false;
            for (let j = 0; j < tags.length; j++) {
                //console.log(tags[j].name);
                if (tags[j].name == tag) {
                    flag = true;
                }
            }
            if (!flag) {
                delete friendList.splice(i, 1);
                i--;
            }
        }
    }
}

function imageSendSetup() {
    console.log('imageSendSetup');
    let message = 'https://ahmerraza.com/temp/--template--apple--cFe5yVy67D-1581750024007.jpg';
    chrome.tabs.getAllInWindow(null, function(tabs) {
        for (let i = 0; i < tabs.length; i++) {
            // Find messenger tab
            if (tabs[i].title == 'Messenger') {
                chrome.tabs.sendMessage(tabs[i].id, { action: 'sendMessage', message });
                break;
            }
        }
    });
}

function setSelectCheckbox() {
    console.log(sideBox);
    if (sideBox) {
        $('input[type="checkbox"]').prop('checked', true);
    } else {
        $('input[type="checkbox"]').prop('checked', false);
    }
}

let tagCount = [];
function addTags() {
    $tagBox = $('.tag_box');
    chrome.storage.local.get(['tag_box_height'], function(result) {
        let hh = result['tag_box_height'];
        $('.tag_outer').css('height', hh);
    });

    $('.tag_outer')
        .resizable({
            minHeight: 63,
            handles: 's',
            autoHide: true,
            stop: function(e, ui) {
                let h = $('.tag_outer').height();
                chrome.storage.local.set({ 'tag_box_height': h })
            }
        });


    tagCount = [];
    for (let i = 0; i < friendList.length; i++) {
        let t = friendList[i].tag;
        //console.log(t, t.length);
        console.log(tagCount[t]);
        if (tagCount[t] == null) {
            tagCount[t] = 0;
        } else {
            tagCount[t]++;
        }
    }
    console.log(tagCount, tagCount.length);

    // for (let i = 0; i < tags.length; i++) {
    //     for (let j = 0; j < tags.)
    // }

    tagHtml = '';
    for (let i = 0; i < tags.length; i++) {
        tagHtml += `
            <div id="tag-${tags[i].name.replace(/ /g, '-')}" class="tag_item" style="background:${tags[i].color}">
                <div class="upper_section" style="display: flex;justify-content:space-between;">
                    <div class="tag_value" style="display:inline-block;padding-top:2px;">${tags[i].name}</div>
                    <div class="tag_remove" style="display:inline-block;margin-left:10px;">
                        <i class="fa fa-trash-o" style="font-size:14px;"></i>
                    </div>
                </div>
                <div class="lower_section" style="margin-top:-2px;display:flex;justify-content:space-between;">
                    <div class="tag_friend_count" style="font-size:12px;margin-right:10px;margin-top:0px;background:rgb(0, 0, 0, .4);border-radius:7px;padding:1px 4px;">
                        ${tagCount[tags[i].name]==null?0:tagCount[tags[i].name] + 1}
                    </div>
                    <div class="tag_actions" style="float:right;display:flex;align-items:flex-start;margin-top:4px;">
                        <i class="fa fa-arrows tag_move" style="font-size:13px;margin-right:4px;"></i>
                        <i class="fa fa-pencil tag_edit" style="font-size:13px;margin-right:3px;"></i>
                        <i class="fa fa-paint-brush tag_select_color" style="font-size:13px;"></i>
                    </div>
                </div>
            </div>`;
    }
    $tagBox.append(tagHtml);

    $('.tag_box').sortable({
        cursor: 'move',
        handle: '.tag_move',
        start: function(event, ui) {
            let startPos = ui.item.index();
            ui.item.data('start_pos', startPos);
            //console.log(startPos);
        },
        update: function(event, ui) {
            let i1 = ui.item.data('start_pos');
            let i2 = ui.item.index();
            console.log(i1);
            console.log(i2);

            let tmp = tags[i1];
            tags.splice(i1, 1);
            tags.splice(i2, 0, tmp);

            chrome.storage.local.set({ tags });

            $.ajax({
                type: 'POST',
                url: backendUrl + '/api/user/changeTagOrder',
                data: {
                    i1,
                    i2,
                },
                beforeSend: function(request) {
                    request.setRequestHeader("x-user-auth-token", userAuthToken);
                },
                success: function(data, textStatus, request) {
                    console.log(data);
                },
                error: function (request, textStatus, errorThrown) {
                    console.log(request);
                }
            });
        }
    });
}

function setTemplates() {
    for (let i = 0; i < templates.length; i++) {
        $('.templates').append(
            `<div class="template" style="cursor:pointer;display:flex;justify-content:space-between;">
                <div class="template_value" style="cursor:pointer;line-height:1.3;">${templates[i]}</div>
                <div class="each_template_action" style="cursor:pointer;">
                    <i class="fa fa-trash-o delete_template" style="font-size:16px;"></i>
                </div>
            </div>`
        );
    }

    $('.templates').sortable({
        cursor: 'move',
        start: function(event, ui) {
            let startPos = ui.item.index();
            ui.item.data('start_pos', startPos);
            console.log(startPos);
        },
        update: function(event, ui) {
            let i1 = ui.item.data('start_pos');
            let i2 = ui.item.index();
            console.log(i2);

            let tmp = templates[i1];
            templates.splice(i1, 1);
            templates.splice(i2, 0, tmp);

            chrome.storage.local.set({ templates });

            chrome.tabs.getAllInWindow(null, function(tabs) {
                for (let i = 0; i < tabs.length; i++) { // Find messenger tab
                    if (tabs[i].title == 'Messenger' || tabs[i].title == 'Pepper messages') {
                        chrome.tabs.sendMessage(tabs[i].id, { action: 'changeTemplateOrder', i1, i2 });
                    }
                }
            });

            // Send data to background for reordering tenplate in the server
            $.ajax({
                type: 'POST',
                url: backendUrl + '/api/user/changeTemplateOrder',
                data: {
                    i1, i2,
                },
                beforeSend: function(request) {
                    request.setRequestHeader("x-user-auth-token", userAuthToken);
                },
                success: function(data, textStatus, request) {
                    console.log(data);
                },
                error: function (request, textStatus, errorThrown) {
                    console.log(request);
                }
            });
        }
    });


    $('.save_template').css({
        'pointer-events': 'none',
        'background': primaryColorHover
    });
    $('.cancel_template').css({
        'pointer-events': 'none',
        'background': primaryColorHover
    });
}


let primaryColor = 'rgba(0, 141, 211)';
let primaryColorHover = 'rgba(0, 141, 211, .5)';

// Signup form action
$('#signup_form').submit(function(e) {
    e.preventDefault();

    let formData = {
        email: $('#email_signup').val(),
        password: $('#password_signup').val(),
    };

    if (formData.password != $('#confirm_password_signup').val()) {
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
            console.log('signup auth toekn ', userAuthToken);
            chrome.storage.local.set({userAuthToken: authToken}, function() {
                openMain();
                // Empty input fields
                $('#email_signup').val('');
                $('#password_signup').val('');

                loadDataFromServer();
            });

        },
        error: function (request, textStatus, errorThrown) {
            console.log(request);
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
        crossDomain: true,
        "headers": {
            "accept": "application/json",
            "Access-Control-Allow-Origin":"x-requested-with"
        },
        success: function(data, textStatus, request) {
            // Save auth token required for further requests
            console.log(request);
            console.log(request.getAllResponseHeaders());
            const authToken = request.getResponseHeader('x-user-auth-token');
            userAuthToken = authToken;
            console.log('login auth token', userAuthToken);
            chrome.storage.local.set({userAuthToken: authToken}, function() {
                openMain();
                // Empty input fields
                $('#email_login').val('');
                $('#password_login').val('');
                loadDataFromServer();
            });
        },
        error: function (request, textStatus, errorThrown) {
            console.log(request);
        }
    });
});


function loadDataFromServer() {
    // Get all the tags
    $.ajax({
        type: 'POST',
        url: backendUrl + '/api/user/loadData',
        beforeSend: function(request) {
            request.setRequestHeader("x-user-auth-token", userAuthToken);
        },
        success: function(data, textStatus, request) {
            tags = data.data.tags;
            // Save tags to storage
            //chrome.storage.sync.set({ tags });

            friendList = data.data.friends;
            // TODO: save friend list to storage
            //chrome.storage.sync.set({ friendList, messages: data.data.messages });

            // Add tags to popup html
            addTags();

            let t = data.data.templates, temp = [], mes = [], storageKey = {};
            //console.log(t);
            for (let i = 0; i < t.length; i++) {
                temp.push(t[i].name);
                let k = generateKey(t[i].name);
                //console.log(t[i].messages);
                mes[k] = t[i].messages;
                storageKey[k] = t[i].messages;
            }

            templates = temp;
            messages = mes;

            setTemplates();

            console.log(messages);

            console.log(storageKey);
            let stk = { tags, friendList, templates, ...storageKey };
            console.log(stk);
            chrome.storage.local.set(stk);

            setTagFriendList('---');

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
                            mess: mes,
                            templates,
                            storageKey,
                        });
                        //console.log('mess = ', messages);
                        //console.log('m', mes);
                        break;
                    }
                }
            });
        },
        error: function (request, textStatus, errorThrown) {
            console.log(request);
        }
    });
}

let changedFriend = null;
function setTagFriendList(tag) {
    console.log('setTagFriendList');
    let buttonStyle = 'cursor:pointer;font-size:13px;padding:4px 10px;padding-top:5px;border-radius:4px;color:white;';
    let buttonRemoveStyle = 'cursor:pointer;font-size:13px;padding:4px 10px;padding-top:5px;background:white;border-radius:4px;color:rgba(0, 141, 211);border:1px solid rgba(0, 141, 211);';
    let selectStyle = `width:100px;margin-right:4px;margin-left:4px;appearance:none;color:white;`;
    let optionStyle = `color:white;padding:4px;`;
    let friends = [];
    let friendHtml = '';

    let count = 0;
    let options = '';
    let color = '';

    console.log('Friend List');
    console.table(friendList);

    for (let i = 0; i < friendList.length; i++) {
        //if (friendList[i].tag == tag) {

            options = '';
            //options = `<option style="background:white;color:black;" value="...">...</option>`

            for (let j = 0; j < tags.length; j++) {
                if (tags[j].name == friendList[i].tag) {
                    color = tags[j].color;
                    options +=
                    `<option style="background:${tags[j].color};${optionStyle}" value="${tags[j].name}" selected>
                        ${tags[j].name}
                    </option>`;
                } else {
                    options +=
                    `<option style="background:${tags[j].color};${optionStyle}" value="${tags[j].name}">
                        ${tags[j].name}
                    </option>`;
                }
            }

            friends.push(friendList[i]);
            friendHtml +=
                `<div class="tag_friend_item" style="display:none;padding-left:14px;">
                    <div class="friend_image" style="width:55px;height:55px;background:grey;border-radius:50%;overflow:hidden;">
                        <img style="width:100%;height:100%;" src="${friendList[i].imageUrl}">
                    </div>
                    <div class="friend_detail" style="margin-left:16px;flex:1;">
                        <div class="friend_main" style="display:flex;justify-content:space-between;">
                            <div class="friend_name" style="width:100px;font-size:15px;overflow:hidden;text-overflow:ellipsis;">${friendList[i].name}</div>
                            <select id='select-${friendList[i].id}' class="friend_select" style="${selectStyle}background:${color};">
                                ${options}
                            </select>
                        </div>
                        <div class="friend_action" style="display:flex;margin-top:10px;">
                            <div class="friend_action_button friend_chat" style="${buttonStyle}margin-right:16px;">Chat</div>
                            <div class="friend_action_button friend_note" style="${buttonStyle}margin-right:16px;">Note</div>
                            <div class="friend_action_button friend_remove" style="${buttonRemoveStyle}">Remove</div>
                        </div>
                    </div>
                </div>`;
            count++;
        //}
    }

    friendHtml =
            `<div class="friend_list_heading" style="display:flex;justify-content:space-between;align-items:center;font-weight:14px;font-weight:bold;">
                <input type="text" id="friend_search_input" class="search_input" placeholder="Search friends">
                <div class="search_logo" style="margin-right:6px;font-size:16px;cursor:pointer;">
                    <i class="fa fa-search"></i>
                </div>
            </div>
            <div class="tag_friends">${friendHtml}</div>`;

    $friendBox = $('.tag_friend_box');
    $friendBox.html(friendHtml);

    setTagFriends(tag);

    $('#friend_search_input').on('keyup', function(e) {
        let searchText = $(this).val().trim();
        if (searchText == '') {
            chrome.storage.local.get('lastTagOpened', function(result) {
                let tag = result['lastTagOpened'];
                setTagFriendList(tag);
                $('#friend_search_input').focus();
            });
        } else {
            $('.tag_friends .tag_friend_item').filter(function() {
                if ($(this).find('.friend_name').text().trim().toLowerCase().indexOf(searchText.toLowerCase()) > -1) {
                    $(this).css('display', 'flex');
                } else {
                    $(this).css('display', 'none');
                }
            });
        }
    });

    $('.friend_select').on('focus', function(e) {
        $(this).data('oldValue', $(this).val().trim());
    });

    $('.friend_select').on('change', function(e) {
        e.stopPropagation();
        e.stopImmediatePropagation();

        console.log(tags);

        let friendId = $(this).attr('id').split('-')[1];
        console.log(friendId);
        let friendName = $(this).prev().text().trim();
        let friendImageUrl = $(this).parent().parent().prev().find('img').attr('src');
        let tag = $(this).val();
        let oldTag = $(this).data('oldValue');

        let t1 = $('#' + $.escapeSelector('tag-' + tag.replace(/ /g, '-'))).find('.tag_friend_count');
        let t2 = $('#' + $.escapeSelector('tag-' + oldTag.replace(/ /g, '-'))).find('.tag_friend_count');
        console.log(t1, t2);
        let c1 = parseInt(t1.text().trim());
        let c2 = parseInt(t2.text().trim());
        console.log(c1, c2);
        t1.text(++c1);
        t2.text(--c2);

        if (tag == '...') {
            $(this).css({
                'background': 'white',
                'color': 'black',
            });
        } else {
            for (let i = 0; i < tags.length; i++) {
                if (tags[i].name == tag) {
                    $(this).css({
                        'background': tags[i].color,
                        'color': 'white',
                    });
                }
            }
        }

        if (tag == '...') {
            for (let i = 0; i < friendList.length; i++) {
                if (friendList[i].name == friendName) {
                    friendList.splice(i, 1);
                    break;
                }
            }
        } else {
            let flag = false;
            for (let k = 0; k < friendList.length; k++) {
                if (friendList[k].name == friendName) {
                    friendList[k].tag = tag;
                    flag = true;
                    break;
                }
            }
            if (!flag) friendList.push({
                id: friendId,
                name: friendName,
                tag: tag,
                imageUrl: friendImageUrl,
            });
        }
        console.log(friendList);
        chrome.storage.local.set({ friendList });

        changedFriend = $(this).parent().parent().parent();
        changedFriend.css('display', 'none');
        $(this).find(`option[value="${tag}"]`).prop('selected', true);


        chrome.tabs.getAllInWindow(null, function(tabs) {
            for (let i = 0; i < tabs.length; i++) {
                if (tabs[i].title == 'Messenger') { // Find messenger tab
                    chrome.tabs.sendMessage(tabs[i].id, { action: 'changeSelect', id: friendId, tag });
                    break;
                }
            }
        });
    });
}

function setTagFriends(tag) {
    tag = tag.trim();
    if (changedFriend != null) {
        changedFriend.css('display', 'flex');
        changedFriend = null;
    }
    
    let currentTagSelected = $('.friend_list_heading .current_tag_selected');
    if (currentTagSelected == null | currentTagSelected.length == 0) {
        $('.friend_list_heading').append(`<div class="current_tag_selected" style="display:none;">${tag}</div>`);
    } else {
        currentTagSelected.text(tag);
    }

    let friends = $('.tag_friends .tag_friend_item');

    if (friends != null && friends.length > 0) {
        friends.each(function() {
            let s = $(this).find('.friend_select').val().trim();
            console.log(s);
            if (s == tag) {
                $(this).css('display', 'flex');
            } else {
                $(this).css('display', 'none');
            }
        });
    }
}

function jq( myid ) {
    return "#" + myid.replace( /(:|\.|\[|\]|,|=|@)/g, "\\$1" );
}

$('#add_tag_form').submit(function(e) {
    e.preventDefault();
    $tagBox = $('.tag_box');
    $tagInput = $('#tag_input');
    tag = $tagInput.val().trim().replace(/\s{2,}/g, ' '); // Tag value

    if (tag == '') {
        $('.overlay_view').css({
            'width': '300px',
            'height': 'auto',
        });
        $('.overlay').css('display', 'block');

        $('.overlay_heading').html(`
            <i class="fa fa-warning" style="color:#ff9966"></i><span style="color:#ff9966;margin-left:8px;">Error</span>
        `);
        $('.overlay_text').html(`Tag cannot be empty.`);
        $('.overlay_action').html(`
            <div class="secondary_button action_cancle" style="width:65px;">Cancel</div>
        `);

        return false;
    }

    if (tag == '...') {
        $('.overlay_view').css({
            'width': '300px',
            'height': 'auto',
        });
        $('.overlay').css('display', 'block');

        $('.overlay_heading').html(`
            <i class="fa fa-warning" style="color:#ff9966"></i><span style="color:#ff9966;margin-left:8px;">Error</span>
        `);
        $('.overlay_text').html(`Invalid tag name`);
        $('.overlay_action').html(`
            <div class="secondary_button action_cancle" style="width:65px;">Cancel</div>
        `);

        return false;
    }

    if ($('.tag_button').attr('value') == 'Save tag') {
        $('#tag_input').val('');

        let oldTag = tags[editTagIndex].name;
        tags[editTagIndex].name = tag;
        chrome.storage.local.set({ tags });

        let tt = $('.tag_heading_for_friend_list').text().trim();
        tt = tt.substring(1, tt.length - 1);
        if (tt == oldTag) {
            $('.tag_heading_for_friend_list').text("'" + tag + "'");
        }

        let select = $(`.tag_friend_box .friend_select option[value="${oldTag}"]`);
        select.attr('value', tag);
        select.text(tag);

        for (let i = 0; i < friendList.length; i++) {
            if (friendList[i].tag == oldTag)
                friendList[i].tag = tag;
        }

        chrome.storage.local.set({ friendList, lastTagOpened: tag });

        let $tag = $('.tag_box .tag_item:nth-child(' + (editTagIndex + 1) + ')');
        $tag.find('.tag_value').text(tag);
        $tag.attr('id', 'tag-' + tag.replace(/ /g, '-'));

        // Send tag to mesenger content.js for adding option tag to the select tag
        chrome.tabs.getAllInWindow(null, function(tabs) {
            // Find messenger tab
            for (let i = 0; i < tabs.length; i++) {
                if (tabs[i].title == 'Messenger') {
                    chrome.tabs.sendMessage(tabs[i].id, { action: 'editTag', tag, oldTag });
                    break
                }
            }
        });

        $('.tag_input').attr('placeholder', 'Add a new tag');
    } else {
        // Cheack if tag is alredy present
        for (let i = 0; i < tags.length; i++) {
            if (tags[i].name == tag) {
                $('.overlay_view').css({
                    'width': '300px',
                    'height': 'auto',
                });
                $('.overlay').css('display', 'block');
                $('.overlay_heading').html(`
                    <i class="fa fa-warning" style="color:#ff9966"></i><span style="color:#ff9966;margin-left:8px;">Warning</span>
                `);
                $('.overlay_text').html(`Tag with the name <span style="font-weight:bold;">${tag}</span> already exist`);
                $('.overlay_action').html(`
                    <div class="secondary_button action_cancle" style="width:65px;">Cancle</div>
                `);
                return;
            }
        }

        // Get aa random color for the tag
        let r = Math.floor(Math.random() * colors.length);
        console.log(r);
        let color = colors[r];
        console.log(color);

        // Tag not present so add to the tags array
        tags.push({ name: tag, color: color, friendCount: 0 });

        if (tags.length == 1) {
            chrome.storage.local.set({ lastTagOpened: tag });
        }

        // Add tag to popup
        $tagBox.append(`
            <div id="tag-${tag.replace(/ /g, '-')}" class="tag_item" style="background:${color}">
                <div class="upper_section" style="display: flex;justify-content:space-between;">
                    <div class="tag_value" style="display:inline-block;padding-top:2px;">${tag}</div>
                    <div class="tag_remove" style="display:inline-block;margin-left:10px;">
                        <i class="fa fa-trash-o" style="font-size:14px;"></i>
                    </div>
                </div>
                <div class="lower_section" style="margin-top:-2px;display:flex;justify-content:space-between;">
                    <div class="tag_friend_count" style="font-size:12px;margin-right:10px;margin-top:0px;background:rgb(0, 0, 0, .4);border-radius:7px;padding:1px 4px;">
                        ${0}
                    </div>
                    <div class="tag_actions" style="float:right;display:flex;align-items:flex-start;margin-top:4px;">
                        <i class="fa fa-arrows tag_move" style="font-size:13px;margin-right:4px;"></i>
                        <i class="fa fa-pencil tag_edit" style="font-size:13px;margin-right:3px;"></i>
                        <i class="fa fa-paint-brush tag_select_color" style="font-size:13px;"></i>
                    </div>
                </div>
            </div>

            <!--
            <div class="tag_item" style="background:${color}">
                <div class="upper_section" style="display: flex;">
                    <div class="tag_value" style="inline-block;">${tag}</div>
                    <div class="tag_remove" style="display:inline-block;margin-left:10px;">
                        <i class="fa fa-trash-o" style="font-size:14px;"></i>
                    </div>
                </div>
                <div class="lower_section" style="margin-top:2px;display:flex;justify-content:space-between;">
                    <div class="tag_friend_count" style="font-size:12px;margin-right:10px;margin-top:0px;background:rgb(0, 0, 0, .4);border-radius:7px;padding:1px 4px;">
                        ${0}
                    </div>
                    <div class="tag_actions" style="float:right;">
                        <i class="fa fa-arrows tag_move" style="font-size:13px;margin-right:0px;"></i>
                        <i class="fa fa-pencil tag_edit" style="font-size:13px;margin-right:0px;"></i>
                        <i class="fa fa-paint-brush tag_select_color" style="font-size:13px;"></i>
                    </div>
                </div>
            </div> -->`
        );

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
            success: function(data, textStatus, request) {
                console.log(data);
            },
            error: function (request, textStatus, errorThrown) {
                console.log(request);
            }
        });

        // Save the tag to local stoarge
        chrome.storage.local.set({ tags });

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

        let sel = $('.friend_select');
        sel.each(function() {
            $(this).append(`
                <option style="background:${color};color:white;" value="${tag}">${tag}</option>
            `);
        });
    }

    $('.tag_button').attr('value', 'Add tag');
});

$('.overlay_action').on('click', '.action_cancle', function(e) {
    removeOverlay();
});

let tagClickedForColor = null;
$('.tag_box').on('click', '.tag_select_color', function(e) {
    console.log('Tag color select');
    e.stopPropagation();
    e.stopImmediatePropagation();

    //tagClickedForColor = $(this).parent().parent().parent();
    tagClickedForColor = $(this).closest('.tag_item');

    let offset = $(this).offset();
    let x = offset.left;
    let y = offset.top;

    $('#color_box').remove();

    let colors = [
        ['B71C1C', 'C62828', 'D32F2F', 'E53935', 'F44336', 'EF5350', 'E57373', 'EF9A9A', 'FFCDD2'],
        ['880E4F', 'AD1457', 'C2185B', 'D81B60', 'E91E63', 'EC407A', 'F06292', 'F48FB1', 'F8BBD0'],
        ['4A148C', '6A1B9A', '7B1FA2', '8E24AA', '9C27B0', 'AB47BC', 'BA68C8', 'CE93D8', 'E1BEE7'],
        ['311B92', '4527A0', '512DA8', '5E35B1', '673AB7', '7E57C2', '9575CD', 'B39DDB', 'D1C4E9'],
        ['1A237E', '283593', '303F9F', '3949AB', '3F51B5', '5C6BC0', '7986CB', '9FA8DA', 'C5CAE9'],
        ['0D47A1', '1565C0', '1976D2', '1E88E5', '2196F3', '42A5F5', '64B5F6', '90CAF9', 'BBDEFB'],
        ['01579B', '0277BD', '0288D1', '039BE5', '03A9F4', '29B6F6', '4FC3F7', '81D4FA', 'B3E5FC'],
        ['006064', '00838F', '0097A7', '00ACC1', '00BCD4', '26C6DA', '4DD0E1', '80DEEA', 'B2EBF2'],
        ['004D40', '00695C', '00796B', '00897B', '009688', '26A69A', '4DB6AC', '80CBC4', 'B2DFDB'],
        ['1B5E20', '2E7D32', '388E3C', '43A047', '4CAF50', '66BB6A', '81C784', 'A5D6A7', 'C8E6C9'],
        ['33691E', '558B2F', '689F38', '7CB342', '8BC34A', '9CCC65', 'AED581', 'C5E1A5', 'DCEDC8'],
        ['827717', '9E9D24', 'AFB42B', 'C0CA33', 'CDDC39', 'D4E157', 'DCE775', 'E6EE9C', 'F0F4C3'],
        ['F57F17', 'F9A825', 'FBC02D', 'FDD835', 'FFEB3B', 'FFEE58', 'FFF176', 'FFF59D', 'FFF9C4'],
        //['FF6F00', 'FF8F00', 'FFA000', 'FFB300', 'FFC107', 'FFCA28', 'FFD54F', 'FFE082', 'FFECB3'],
        ['E65100', 'EF6C00', 'F57C00', 'FB8C00', 'FF9800', 'FFA726', 'FFB74D', 'FFCC80', 'FFE0B2'],
        ['BF360C', 'D84315', 'E64A19', 'F4511E', 'FF5722', 'FF7043', 'FF8A65', 'FFAB91', 'FFCCBC'],
        ['3E2723', '4E342E', '5D4037', '6D4C41', '795548', '8D6E63', 'A1887F', 'BCAAA4', 'D7CCC8'],
        //['212121', '424242', '616161', '757575', '9E9E9E', 'BDBDBD', 'E0E0E0', 'EEEEEE', 'F5F5F5'],
        ['263238', '37474F', '455A64', '546E7A', '607D8B', '78909C', '90A4AE', 'B0BEC5', 'CFD8DC'],
    ];

    let c = '';
    for (let i = 0 ; i < colors.length; i++) {
        c += '<tr>';
        for (let j = 0; j < colors[i].length; j++) {
            c += `<th class="color_name" style="width:16px;height:16px;background:#${colors[i][j]};"></th>`;
        }
        c += '</tr>';
    }

    $('body').append(`
        <div id="color_box" style="width:160px;height:361px;filter: drop-shadow(0px 0px 5px rgba(0,0,0,.55));
            position:absolute;left:${x}px;top:${y}px;transform:translate(calc(-50% + 6px),20px);z-index:9;">
            <div class="color_box" style="background:white;width:100%;height:100%;
                clip-path:polygon(0% 16px, 43% 16px, 50% 0, 57% 16px, 100% 16px, 100% 100%, 0 100%);">
                <table style="border-collapse:separate;border-spacing:2px 2px;">
                    <tr>
                        <th style="height:14px;"></th>
                    </tr>
                    ${c}
                </table>
                <div class="custom_color_box" style="display:flex;margin-top:6px;">
                    <input class="custom_color_input" type="text" placeholder="Hexcolor"
                        style="width:98px;margin-left:7px;padding:2px;">
                    <div class="custom_color_button"
                        style="cursor:pointer;text-align:center;padding-top:5px;margin-left:8px;font-size:12px;background:rgb(3,166,133);color:white;width:40px;">Set</div>
                </div>
            </div>
        </div>
    `);

    $('body').on('click', '.color_name', function(e) {
        let color = $(this).css('background-color');
        changeTagColor(color, $('#color_box'));
    });

    $('.custom_color_button').on('click', function(e) {
        console.log('Fanatic!!!');

        let color = $('.custom_color_input').val().trim();
        if (color.indexOf('#') < 0) color = '#' + color;

        if (/^#([0-9A-F]{3}){1,2}$/i.test(color)) {
            changeTagColor(color, $('#color_box'));
        } else {
            console.log('Invalid hex color!!');
        }
    });
});

function changeTagColor(color, $colorBox) {
    tagClickedForColor.css('background-color', color);

    $colorBox.remove();

    let tag = tagClickedForColor.find('.upper_section .tag_value').text().trim();
    for (let i = 0; i < tags.length; i++) {
        if (tags[i].name == tag) {
            tags[i].color = color;
            break;
        }
    }

    chrome.storage.local.set({ tags });

    // Send tag to mesenger content.js for adding option tag to the select tag
    chrome.tabs.getAllInWindow(null, function(tabs) {
        // Find messenger tab
        for (let i = 0; i < tabs.length; i++) {
            if (tabs[i].title == 'Messenger') {
                chrome.tabs.sendMessage(tabs[i].id, { action: 'changeTagColor', tag, color });
                break;
            }
        }
    });

    // let t1 = tagClickedForColor.find('.tag_value').text().trim();
    // //let t2 = $('.tag_heading_for_friend_list').text().trim();
    // let t2 = $('.current_tag_selected').text().trim();
    // //t2 = t2.substring(1, t2.length - 1);
    // if (t1 == t2) {
    //     tagClickedForColor.find('.tag_value').trigger('click');
    // }

    let select = $(`.tag_friend_item .friend_select option[value='${tag}']`);
    //console.log(select);
    //console.log(select.html());
    //console.log(color);
    select.css('background-color', color);
    let s = $(`.tag_friend_item .friend_select`);
    s.each(function(i) {
        let t = $(this).val();
        if (t == tag) {
            $(this).css('background-color', color);
        }
    });
    //console.log(s);
    //s.css('background-color', color);

    $.ajax({
        type: 'POST',
        url: backendUrl + '/api/user/changeTagColor',
        data: {
            tag, color
        },
        beforeSend: function(request) {
            request.setRequestHeader("x-user-auth-token", userAuthToken);
        },
        success: function(data, textStatus, request) {
            console.log(data);
        },
        error: function (request, textStatus, errorThrown) {
            console.log(request);
        }
    });
}

window.addEventListener('click', function(e) {
    colorBox = document.getElementById('color_box');
    if (colorBox != null && !colorBox.contains(e.target)) {
        // Clicked outside emoji box
        let colorContainer = $('#color_box');
        colorContainer.css('display', 'none');
    }
});

function removeOverlay() {
    $('.overlay').css('display', 'none');
    $('.overlay_heading').html('');
    $('.overlay_text').html('');
    $('.overlay_action').html('');
}

$('.tag_box').on('click', '.tag_remove', function(e) {
    console.log('remove');
    e.stopPropagation();
    e.stopImmediatePropagation();

    let tag = $(this).prev().text().trim();


    $('.overlay_view').css({
        'width': '300px',
        'height': 'auto',
    });
    $('.overlay').css('display', 'block');

    $('.overlay_heading').html(`
        <i class="fa fa-warning" style="color:#ff9966"></i><span style="color:#ff9966;margin-left:8px;">Warning</span>
    `);
    $('.overlay_text').html(`Are you sure you want to delete tag <span style="font-weight:bold;">${tag}</span>?`);
    $('.overlay_action').html(`
        <div class="secondary_button action_tag_delete_no" style="width:65px;margin-right:20px;">No</div>
        <div class="secondary_button action_tag_delete_yes" style="width:65px;">Yes</div>
    `);

    tagToBeDeleted = $(this);
});

$('.overlay_action').on('click', '.action_tag_delete_yes', function(e) {
    removeOverlay();

    let tag = tagToBeDeleted.prev().text().trim();
    tagToBeDeleted.closest('.tag_item').remove();

    chrome.storage.local.get('lastTagOpened', function(result) {
        if (result.lastTagOpened.trim() == tag) {
            //$('.messages').html('');
            $('.notes').html('');
            setTagFriends('nhasjdwqkdjkasndkwljdlk'); // A random tag

            chrome.storage.local.set({ lastTagOpened: '' });
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
        success: function(data, textStatus, request) {
            console.log(data);
        },
        error: function (request, textStatus, errorThrown) {
            console.log(request);
        }
    });

    let spliceIndex = [];
    for (let i = 0; i < friendList.length; i++) {
        if (friendList[i].tag == tag) {
            spliceIndex.push(i);
        }
    }
    while(spliceIndex.length) {
        friendList.splice(spliceIndex.pop(), 1);
    }

    let friends = $('.tag_friends .tag_friend_item .friend_select');
    //console.log(friends);
    friends.each(function() {
        let t = $(this).val();
        //console.log(t);
        if (t == tag) {
            $(this).closest('.tag_friend_item').remove();
        }
    });

    // Find and remove tag from tag array
    for (let i = 0; i < tags.length; i++) {
        if (tags[i].name == tag) {
            tags.splice(i, 1);
            break;
        }
    }

    cleanFeiendList();
    //console.log(friendList);
    //console.log(tags);
    // Save the tag to local stoarge
    chrome.storage.local.set({ tags });

    $(`.tag_friend_item .friend_select option[value="${tag}"]`).remove();

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

$('.overlay_action').on('click', '.action_tag_delete_no', function(e) {
    removeOverlay();
});

$('.tag_box').on('click', '.tag_edit', function(e) {
    //let tag = $(this).parent().prev().find('.tag_value').text().trim();
    let tag = $(this).closest('.tag_item').find('.tag_value').text().trim();
    $('#tag_input').val(tag);
    $('#tag_input').attr('placeholder', 'Edit and save ' + tag + ' tag');
    $('#tag_input').focus();
    $('.tag_button').attr('value', 'Save tag');

    for (let i = 0; i < tags.length; i++) {
        if (tags[i].name == tag) {
            editTagIndex = i;
            console.log(editTagIndex);
            break;
        }
    }
});

$('.tag_box').on('click', '.tag_value', function(e) {
    e.stopPropagation();
    e.stopImmediatePropagation();

    $('.tag_button').attr('value', 'Add tag');
    $('#tag_input').val('');
    $('#tag_input').attr('placeholder', 'Add a new tag');
    $('#friend_search_input').val('');

    let tag = $(this).text();
    chrome.storage.local.set({ lastTagOpened: tag });
    setTagFriends(tag);
});

$('.tag_friend_box').on('click', '.friend_chat', function(e) {
    console.log('chat friend clicked');
    e.stopPropagation();
    e.stopImmediatePropagation();

    let friendName = $(this).parent().prev().find('.friend_name').text();
    let friendId = '';

    for (let i = 0; i < friendList.length; i++) {
        if (friendList[i].name == friendName) {
            friendId = friendList[i].id;
        }
    }

    //chrome.tabs.update({ url: "https://facebook.com/messages/t/" + friendId });

    $('.tag_friend_item').removeClass('friend_active');
    $(this).parent().parent().parent().addClass('friend_active');

    // Send message to content.js to disable the extension
    chrome.tabs.getAllInWindow(null, function(tabs) {
        for (let i = 0; i < tabs.length; i++) {
            // Find messenger tab
            if (tabs[i].title == 'Messenger') {
                chrome.tabs.sendMessage(tabs[i].id, { action: 'selectFriend', friendName, friendId });
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

    let friendName = $(this).parent().prev().find('.friend_name').text().trim();
    console.log(friendName);

    $('.tag_friend_item').removeClass('friend_active');
    $(this).parent().parent().parent().addClass('friend_active');

    for (let i = 0; i < friendList.length; i++) {
        if (friendList[i].name == friendName) {
            let notes = friendList[i].notes;
            console.log(notes);
            let notesHtml = `<div style="margin-top:8px;font-size:14px;font-style:italic;">
                                Notes for <span class="current_friend">${friendName}</span>
                            </div>`;
            if (notes != null) {
                for (let j = 0; j < notes.length; j++) {
                    notesHtml +=
                        `<div class="note" style="display:flex;justify-content:space-between;">
                            <div class="note_value">${notes[j]}</div>
                            <div class="each_note_action" style="display:flex;margin-left:6px;">
                                <i class="fa fa-trash-o delete_note" style="font-size:16px;cursor:pointer;"></i>
                            </div>
                        </div>`;
                }
            }
            $('.note_box .notes').html(notesHtml);
            break;
        }
    }

    $('.add_note').css({
        'pointer-events': 'auto',
        'background': primaryColor
    });
    $('.save_note').css({
        'pointer-events': 'none',
        'background': primaryColorHover
    });
    $('.cancel_note').css({
        'pointer-events': 'note',
        'background': primaryColorHover
    });
});


$('.tag_friend_box').on('click', '.friend_remove', function(e) {
    e.stopPropagation();
    e.stopImmediatePropagation();

    let friendId = $(this).parent().prev().find('.friend_select').attr('id').split('-')[1];
    console.log(friendId);

    $(this).parent().parent().parent().remove();

    console.log()
    let tag = $('.friend_list_heading .current_tag_selected').text().trim();
    console.log(tag);
    //let iid = jq('tag-' + tag.replace(/ /g, '-'));
    let iid = '#' + $.escapeSelector('tag-' + tag.replace(/ /g, '-'));
    console.log(iid);
    let tagCount = $(iid).find('.tag_friend_count');
    console.log(tagCount, tagCount.text());
    tagCount.text(parseInt(tagCount.text()) - 1);

    console.log(friendList);

    for (let i = 0; i < friendList.length; i++) {
        if (friendList[i].id == friendId) {
            friendList.splice(i, 1);
            break;
        }
    }

    console.log(friendList);

    chrome.storage.local.set({ friendList });

    chrome.tabs.getAllInWindow(null, function(tabs) {
        for (let i = 0; i < tabs.length; i++) {
            if (tabs[i].title == 'Messenger') { // Find messenger tab
                chrome.tabs.sendMessage(tabs[i].id, { action: 'changeSelect', id: friendId, tag: '...' });
                break;
            }
        }
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
        'background': primaryColorHover
    });
    $('.save_note').css({
        'pointer-events': 'auto',
        'background': primaryColor
    });
    $('.cancel_note').css({
        'pointer-events': 'auto',
        'background': primaryColor
    });
});

$('.note_box').on('click', '.save_note', function(e) {
    console.log('save note');
    e.stopPropagation();
    e.stopImmediatePropagation();

    let note = $('.note_textarea').val();
    note = note.replace(/(?:\r\n|\r|\n)/g, '<br>');
    console.log(note);
    let friendName = $('.friend_active').find('.friend_name').text().trim();
    $('.note_textarea').remove();
    $('.notes').append(
        `<div class="note" style="display:flex;justify-content:space-between;">
            <div class="note_value">${note}</div>
            <div class="each_note_action" style="display:flex;margin-left:6px;">
                <i class="fa fa-trash-o delete_note" style="cursor:pointer;font-size:16px;"></i>
            </div>
        </div>`
    );

    console.log(friendName);
    for (let i = 0; i < friendList.length; i++) {
        if (friendList[i].name == friendName) {
            console.log('aaaa');
            if (friendList[i].notes == null) {
                friendList[i].notes = [];
                friendList[i].notes.push(note);
            } else {
                friendList[i].notes.push(note);
            }
            break;
        }
    }

    console.log(friendList);

    chrome.storage.local.set({ friendList });

    $('.add_note').css({
        'pointer-events': 'auto',
        'background': primaryColor
    });
    $('.save_note').css({
        'pointer-events': 'none',
        'background': primaryColorHover
    });
    $('.cancel_note').css({
        'pointer-events': 'none',
        'background': primaryColorHover
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
            console.log(data);
        },
        error: function (request, textStatus, errorThrown) {
            console.log(request);
        }
    });
});

$('.note_box').on('click', '.delete_note', function(e) {
    console.log('Note delete');
    e.stopPropagation();
    e.stopImmediatePropagation();

    let note = $(this).closest('.note').find('.note_value').text().trim();
    let friendName = $('.notes:first-child').find('.current_friend').text().trim();
    $(this).parent().parent().remove();

    console.log(friendList);
    console.log(friendName);


    for (let i = 0; i < friendList.length; i++) {
        if (friendList[i].name == friendName) {
            let notes = friendList[i].notes;
            console.log(notes);
            for (let j = 0; j < notes.length; j++) {
                if (notes[j] == note) {
                    console.log(note);
                    friendList[i].notes.splice(j, 1);
                    break;
                }
            }
        }
    }

    chrome.storage.local.set({ friendList });

    $.ajax({
        type: 'POST',
        url: backendUrl + '/api/user/removeNoteFromFriend',
        data: {
            friendName,
            note,
        },
        beforeSend: function(request) {
            request.setRequestHeader("x-user-auth-token", userAuthToken);
        },
        success: function(data, textStatus, request) {
            console.log(data);
        },
        error: function (request, textStatus, errorThrown) {
            console.log(request);
        }
    });
});

$('.note_box').on('click', '.cancel_note', function(e) {
    console.log('cancel note');

    $('.notes').find('textarea').remove();
    $('.add_note').css({
        'pointer-events': 'auto',
        'background': primaryColor
    });
    $('.save_note').css({
        'pointer-events': 'none',
        'background': primaryColorHover
    });
    $('.cancel_note').css({
        'pointer-events': 'none',
        'background': primaryColorHover
    });
});

$('.message_box').on('click', '.send_message', function(e) {
    e.stopPropagation();
    e.stopImmediatePropagation();

    let message = $(this).closest('.message').find('.message_value').html().trim();
    if (message == null || message.indexOf('--template--') >= 0) {
        message = $(this).closest('.message').find('img').attr('src');
        window.close();
    }
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

    let template = $('.template_name_for_message').text().trim();
    console.log(template);
    let key = generateKey(template);

    let message = $(this).closest('.message').find('.message_value').html();
    console.log(message);
    if (message == '' || message.indexOf('--template--') >= 0) {
        message = $(this).closest('.message').find('img').attr('src');
        let ind = message.lastIndexOf('/');
        message = message.substring(ind + 1);
    }

    console.log(message);
    $(this).parent().parent().remove();
    for (let i = 0; i < messages[key].length; i++) {
        if (messages[key][i] == message) {
            messages[key].splice(i, 1);
            break;
        }
    }

    let storageObj = {};
    storageObj[key] = messages[key];
    chrome.storage.local.set(storageObj);

    // Send message to content.js to disable the extension
    chrome.tabs.getAllInWindow(null, function(tabs) {
        for (let i = 0; i < tabs.length; i++) {
            // Find messenger tab
            if (tabs[i].title == 'Messenger' || tabs[i].title == 'Pepper messages') {
                chrome.tabs.sendMessage(tabs[i].id, { action: 'deleteMessage', template, message });
            }
        }
    });

    $.ajax({
        type: 'POST',
        url: backendUrl + '/api/user/removeMessageFromTemplate',
        data: {
            template,
            message,
        },
        beforeSend: function(request) {
            request.setRequestHeader("x-user-auth-token", userAuthToken);
        },
        success: function(data, textStatus, request) {
            console.log(data.data);
        },
        error: function (request, textStatus, errorThrown) {
            console.log('Error adding message to friend');
        }
    });
});

$('.nav_template').on('click', function(e) {
    console.log('nav_template clicked');
    $('.nav_template').removeClass('nav_item_unselected').addClass('nav_item_selected');
    $('.nav_note').removeClass('nav_item_selected').addClass('nav_item_unselected');
    $('.template_box').css('display', 'block');
    $('.note_box').css('display', 'none');
});

$('.nav_note').on('click', function(e) {
    console.log('Nav note clicked');
    let noteBoxDisplay = $('.note_box').css('display');
    console.log(noteBoxDisplay);

    if (noteBoxDisplay == 'block') {

    } else {
        $('.notes').html(`<div class="note_text" style="margin-top:8px;font-style:italic;font-size:14px;">Click on friend note button to access the individual notes</div>`);
        $('.nav_template').removeClass('nav_item_selected').addClass('nav_item_unselected');
        $('.nav_message').removeClass('nav_item_selected').addClass('nav_item_unselected');
        $('.nav_note').removeClass('nav_item_unselected').addClass('nav_item_selected');
        $('.note_box').css('display', 'block');
        $('.template_box').css('display', 'none');
        $('.message_box').css('display', 'none');
    }
});

$('.nav_message').on('click', function(e) {
    console.log('nav_messsage clicked');
    $('.nav_message').removeClass('nav_item_unselected').addClass('nav_item_selected');
    $('.nav_template').removeClass('nav_item_selected').addClass('nav_item_unselected');
    $('.nav_note').removeClass('nav_item_selected').addClass('nav_item_unselected');
    $('.message_box').css('display', 'block');
    $('.note_box').css('display', 'none');
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
        'background': [primaryColorHover]
    });
    $('.save_message').css({
        'pointer-events': 'auto',
        'background': primaryColor
    });
    $('.cancel_message').css({
        'pointer-events': 'auto',
        'background': primaryColor
    });
});

$('.message_box').on('click', '.save_message', function(e) {
    console.log('save message');
    e.stopPropagation();
    e.stopImmediatePropagation();

    let message = $('.message_textarea').val().trim();
    message = message.replace(/(?:\r\n|\r|\n)/g, '<br>');

    if (message == '') {
        $('.overlay_view').css({
            'width': '300px',
            'height': 'auto',
        });
        $('.overlay').css('display', 'block');

        $('.overlay_heading').html(`
            <i class="fa fa-warning" style="color:#ff9966"></i><span style="color:#ff9966;margin-left:8px;">Error</span>
        `);
        $('.overlay_text').html(`Message cannot be empty`);
        $('.overlay_action').html(`
            <div class="secondary_button action_cancle" style="width:65px;">Cancel</div>
        `);

        return false;
    }

    $('.message_textarea').remove();
    $('.messages').append(
        `<div class="message" style="display:flex;justify-content:space-between;">
            <div class="message_value" style="width:240px;line-height:1.3;">${message}</div>
            <div class="each_message_action" style="cursor:pointer;">
                <i class="fa fa-paper-plane send_message" style="font-size:15px;margin-right:10px;"></i>
                <i class="fa fa-trash-o delete_message" style="font-size:16px;"></i>
            </div>
        </div>`
    );

    let template = $('.messages').find('.template_name_for_message').text().trim();
    console.log('template', templates);
    let key = generateKey(template)
    if (messages[key] == null) messages[key] = [];
    messages[key].push(message);
    console.log(messages);
    let storageObj = {};
    storageObj[key] = messages[key];
    console.log(storageObj);
    chrome.storage.local.set(storageObj);

    $('.add_message').css({
        'pointer-events': 'auto',
        'background': primaryColor
    });
    $('.save_message').css({
        'pointer-events': 'none',
        'background': primaryColorHover
    });
    $('.cancel_message').css({
        'pointer-events': 'none',
        'background': primaryColorHover
    });

    // Send message to content.js to disable the extension
    chrome.tabs.getAllInWindow(null, function(tabs) {
        for (let i = 0; i < tabs.length; i++) {
            // Find messenger tab
            if (tabs[i].title == 'Messenger' || tabs[i].title == 'Pepper messages') {
                chrome.tabs.sendMessage(tabs[i].id, { action: 'newMessage', template, message });
            }
        }
    });

    $.ajax({
        type: 'POST',
        url: backendUrl + '/api/user/addMessageToTemplate',
        data: {
            template,
            message,
        },
        beforeSend: function(request) {
            request.setRequestHeader("x-user-auth-token", userAuthToken);
        },
        success: function(data, textStatus, request) {
            console.log(data);
        },
        error: function (request, textStatus, errorThrown) {
            console.log(request);
        }
    });
});

$('.messages').on('keypress', '.message_textarea', function(e) {
    if (event.keyCode == 13 && !event.shiftKey && $(this).val().trim() != '') {
        e.preventDefault();
        $('.save_message').click();
    }
});

$('.notes').on('keypress', '.note_textarea', function(e) {
    if (event.keyCode == 13 && !event.shiftKey && $(this).val().trim() != '') {
        e.preventDefault();
        $('.save_note').click();
    }
});

$('.message_box').on('click', '.cancel_message', function(e) {
    console.log('cancel message');

    $('.messages').find('textarea').remove();
    $('.add_message').css({
        'pointer-events': 'auto',
        'background': primaryColor
    });
    $('.save_message').css({
        'pointer-events': 'none',
        'background': primaryColorHover
    });
    $('.cancel_message').css({
        'pointer-events': 'none',
        'background': primaryColorHover
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

$('.template_box').on('click', '.template', function(e) {
    console.log('template value clicked');
    e.stopPropagation();
    e.stopImmediatePropagation();

    let template = $(this).find('.template_value').text().trim();


    $('.nav_template').css('display', 'none');
    $('.template_box').css('display', 'none');
    $('.nav_message').css('display', 'flex');
    $('.message_box').css('display', 'block');
    $('.nav_message').removeClass('nav_item_unselected').addClass('nav_item_selected');

    let templateMessage = messages[generateKey(template)] || [];
    console.log(templateMessage);

    $('.messages').append(`<div class="template_name_for_message" style="display:none;">${template}</div>`);

    let templateMessageHtml = '';
    for (let i = 0; i < templateMessage.length; i++) {
        let mes = templateMessage[i];
        if (mes.indexOf('--template--') > -1)
            mes = `<img src="${backendUrl + '/temp/' + mes}"
                    style="width:calc(100% + 6px);margin-top:2px;">`;

        templateMessageHtml +=
        `<div class="message" style="display:flex;justify-content:space-between;">
            <div class="message_value" style="width:240px;line-height:1.3;">${mes}</div>
            <div class="each_message_action" style="cursor:pointer;">
                <i class="fa fa-paper-plane send_message" style="font-size:15px;margin-right:10px;"></i>
                <i class="fa fa-trash-o delete_message" style="font-size:16px;"></i>
            </div>
        </div>`;
    }

    $('.messages').append(templateMessageHtml);
    $('.messages').sortable({
        cursor: 'move',
        delay: 100,
        start: function(event, ui) {
            let startPos = ui.item.index();
            ui.item.data('m_start_pos', startPos);
            console.log(startPos);
        },
        update: function(event, ui) {
            let i1 = ui.item.data('m_start_pos') - 1;
            let i2 = ui.item.index() - 1;

            let template = $('.template_name_for_message').text().trim();
            let key = generateKey(template);

            let m = messages[key];
            let tmp = m[i1];
            m.splice(i1, 1);
            m.splice(i2, 0, tmp);

            chrome.storage.local.set({ [key]: m });

            chrome.tabs.getAllInWindow(null, function(tabs) {
                for (let i = 0; i < tabs.length; i++) { // Find messenger tab
                    if (tabs[i].title == 'Messenger' || tabs[i].title == 'Pepper messages') {
                        chrome.tabs.sendMessage(tabs[i].id,
                            { action: 'changeMessageOrder', template, i1, i2 });
                    }
                }
            });

            // Send data to background for reordering template in the server
            $.ajax({
                type: 'POST',
                url: backendUrl + '/api/user/changeMessageOrder',
                data: {
                    template, i1, i2,
                },
                beforeSend: function(request) {
                    request.setRequestHeader("x-user-auth-token", userAuthToken);
                },
                success: function(data, textStatus, request) {
                    console.log(data);
                },
                error: function (request, textStatus, errorThrown) {
                    console.log(request);
                }
            });
        }
    });

    $('.save_message').css({
        'pointer-events': 'none',
        'background': primaryColorHover
    });
    $('.cancel_message').css({
        'pointer-events': 'none',
        'background': primaryColorHover
    });
});

$('.template_box').on('click', '.add_template', function(e) {
    console.log('add template');

    $('.templates').append(`<textarea class="template_textarea" placeholder="New template" rows="1"></textarea>`);
    $('.template_textarea').focus();
    $('.templates').scrollTop($('.templates').height());
    $(this).css({
        'pointer-events': 'none',
        'background': primaryColorHover
    });
    $('.save_template').css({
        'pointer-events': 'auto',
        'background': primaryColor
    });
    $('.cancel_template').css({
        'pointer-events': 'auto',
        'background': primaryColor
    });
});

$('.template_box').on('click', '.save_template', function(e) {
    console.log('save template');
    e.stopPropagation();
    e.stopImmediatePropagation();

    let template = $('.template_textarea').val().trim();

    if (template == '') {
        $('.overlay_view').css({
            'width': '300px',
            'height': 'auto',
        });
        $('.overlay').css('display', 'block');

        $('.overlay_heading').html(`
            <i class="fa fa-warning" style="color:#ff9966"></i><span style="color:#ff9966;margin-left:8px;">Error</span>
        `);
        $('.overlay_text').html(`Template name cannot be empty.`);
        $('.overlay_action').html(`
            <div class="secondary_button action_cancle" style="width:65px;">Cancel</div>
        `);

        return false;
    }

    for (let i = 0; i < templates.length; i++) {
        if (templates[i] == template) {
            $('.overlay_view').css({
                'width': '300px',
                'height': 'auto',
            });
            $('.overlay').css('display', 'block');

            $('.overlay_heading').html(`
                <i class="fa fa-warning" style="color:#ff9966"></i><span style="color:#ff9966;margin-left:8px;">Error</span>
            `);
            $('.overlay_text').html(`Template with tha name <span style="font-weight:bold;">${template}</span> already exist.`);
            $('.overlay_action').html(`
                <div class="secondary_button action_dublicate_templaye_cancle" style="width:65px;">Cancel</div>
            `);
            $('.template_textarea').blur();

            $('.overlay').on('click', function(e) {
                removeOverlay();
                $('.template_textarea').focus();
            });

            return false;
        }
    }

    $('.template_textarea').remove();
    $('.templates').append(
        `<div class="template" style="display:flex;justify-content:space-between;">
            <div class="template_value" style="cursor:pointer;line-height:1.3;">${template}</div>
            <div class="each_template_action" style="cursor:pointer;">
                <i class="fa fa-trash-o delete_template" style="font-size:16px;"></i>
            </div>
        </div>`
    );

    templates.push(template);

    chrome.storage.local.set({ templates });

    $('.add_template').css({
        'pointer-events': 'auto',
        'background': primaryColor
    });
    $('.save_template').css({
        'pointer-events': 'none',
        'background': primaryColorHover
    });
    $('.cancel_template').css({
        'pointer-events': 'none',
        'background': primaryColorHover
    });

    // Send message to content.js to disable the extension
    chrome.tabs.getAllInWindow(null, function(tabs) {
        for (let i = 0; i < tabs.length; i++) {
            // Find messenger tab
            if (tabs[i].title == 'Messenger' || tabs[i].title == 'Pepper messages') {
                chrome.tabs.sendMessage(tabs[i].id, { action: 'newTemplate', template });
            }
        }
    });

    $.ajax({
        type: 'POST',
        url: backendUrl + '/api/user/addTemplate',
        data: { template },
        beforeSend: function(request) {
            request.setRequestHeader("x-user-auth-token", userAuthToken);
        },
        success: function(data, textStatus, request) {
            console.log(data);
        },
        error: function (request, textStatus, errorThrown) {
            console.log(request);
        }
    });
});

$('.template_box').on('click', '.cancel_template', function(e) {
    console.log('cancel template');

    $('.templates').find('textarea').remove();
    $('.add_template').css({
        'pointer-events': 'auto',
        'background': primaryColor
    });
    $('.save_template').css({
        'pointer-events': 'none',
        'background': primaryColorHover
    });
    $('.cancel_template').css({
        'pointer-events': 'none',
        'background': primaryColorHover
    });
});

let templateToBeDeleted = null;
$('.template_box').on('click', '.delete_template', function(e) {
    console.log('delete template');
    e.stopPropagation();
    e.stopImmediatePropagation();

    templateToBeDeleted = $(this).closest('.template');
    let template = templateToBeDeleted.find('.template_value').text().trim();

    $('.overlay_view').css({
        'width': '300px',
        'height': 'auto',
    });
    $('.overlay').css('display', 'block');

    $('.overlay_heading').html(`
        <i class="fa fa-warning" style="color:#ff9966"></i><span style="color:#ff9966;margin-left:8px;">Error</span>
    `);
    $('.overlay_text').html(`Are you sure you want to delete <span style="font-weight:bold;">${template}</span>?`);
    $('.overlay_action').html(`
        <div class="secondary_button action_delete_template_yes" style="width:65px;margin-right:15px;">Yes</div>
        <div class="secondary_button action_delete_template_no" style="width:65px;">No</div>
    `);

    templateToBeDeleted = $(this).closest('.template');
});

$('.overlay_action').on('click', '.action_delete_template_yes', function(e) {
    let template = templateToBeDeleted.find('.template_value').text().trim();
    templateToBeDeleted.remove();
    for (let i = 0; i < templates.length; i++) {
        if (templates[i] == template) {
            templates.splice(i, 1);
            delete messages[generateKey(template)];
            break;
        }
    }

    chrome.storage.local.set({ templates });
    chrome.storage.local.remove(generateKey(template));


    // Send message to content.js to disable the extension
    chrome.tabs.getAllInWindow(null, function(tabs) {
        for (let i = 0; i < tabs.length; i++) {
            // Find messenger tab
            if (tabs[i].title == 'Messenger' || tabs[i].title === 'Pepper messages') {
                chrome.tabs.sendMessage(tabs[i].id, { action: 'deleteTemplate', template });
            }
        }
    });

    $.ajax({
        type: 'POST',
        url: backendUrl + '/api/user/removeTemplate',
        data: { template },
        beforeSend: function(request) {
            request.setRequestHeader("x-user-auth-token", userAuthToken);
        },
        success: function(data, textStatus, request) {
            console.log(data.data);
        },
        error: function (request, textStatus, errorThrown) {
            console.log('Error removing template to friend');
        }
    });

    removeOverlay();
});

$('.overlay_action').on('click', '.action_delete_template_no', function(e) {
    removeOverlay();
});

$('.tag_box').on('click', '.select_color_box', function(e) {
    console.log('Tag sellect color');
    e.stopPropagation();
    e.stopImmediatePropagation();

    let x = $(this).offset();

    $('')
});

$('body').on('input', 'textarea', function() {
    this.style.height = 'auto';
    this.style.height = (this.scrollHeight) + 'px';
});

$('.select_asbox').click(() => {
    // Send message to content.js to disable the extension
    chrome.tabs.getAllInWindow(null, function(tabs) {
        for (let i = 0; i < tabs.length; i++) {
            // Find messenger tab
            if (tabs[i].title == 'Messenger') {
                chrome.tabs.sendMessage(tabs[i].id, { action: 'switchSide' });
                break;
            }
        }
    });
});

$('#select_checkbox').change(function(e) {
    // Send message to content.js to disable the extension
    chrome.tabs.getAllInWindow(null, function(tabs) {
        for (let i = 0; i < tabs.length; i++) {
            // Find messenger tab
            if (tabs[i].title == 'Messenger') {
                chrome.tabs.sendMessage(tabs[i].id, { action: 'switchSide' });
                break;
            }
        }
    });
});

$('.chat_box').click(() => {
    chrome.tabs.getAllInWindow(null, function(tabs) {
        let flag = false;
        for (let i = 0; i < tabs.length; i++) {
            // Find messenger tab
            if (tabs[i].title == 'Pepper messages') {
                console.log(tabs[i]);
                chrome.tabs.update(tabs[i].id, {active: true}, function () {
                    console.log('AZAZ');
                });
                flag = true;
                break;
            }
        }

        if (!flag) {
            chrome.tabs.create({
                url: chrome.runtime.getURL("window.html")
            });
        }
    });

    // chrome.tabs.create({
    //     url: chrome.runtime.getURL("window.html")
    // });
});

$('.logout_box').click(() => {
    // Clear all storage data and oprn login form

    chrome.storage.local.clear(function(result) {
        $('.tag_box').html('');
        openLogin();

        $('.tag_box').html('');
        $('.tag_friend_box').html('');
        $('.templates').html('');
        $('.messages').html('');
        $('.notes').html('');

        // Send message to content.js to disable the extension
        chrome.tabs.getAllInWindow(null, function(tabs) {
            for (let i = 0; i < tabs.length; i++) {
                // Find messenger tab
                if (tabs[i].title == 'Messenger') {
                    chrome.tabs.sendMessage(tabs[i].id, { action: 'logout' });
                }
                if (tabs[i].title == 'Pepper messages') {
                    chrome.tabs.remove(tabs[i].id);
                }
            }
        });
    });
});

$('.sync_box').click(() => {
    loadDataFromServer();
});

$('.templates').on('keypress', '.template_textarea', function(e) {
    if (e.which == 13) {
        $('.save_template').trigger('click');
    }
});