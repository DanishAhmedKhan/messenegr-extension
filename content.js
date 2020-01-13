console.log('Hello from messenger extension!');

// Add custom click function to jQuery
jQuery.fn.extend({
    'mclick': function () {
        var click_event = document.createEvent('MouseEvents')
        click_event.initMouseEvent("click", true, true, window,
        0, 0, 0, 0, 0,
        false, false, false, false,
        0, null);
        return $(this).each(function () {
            $(this)[0].dispatchEvent(click_event)
        })
    },	
})


var conversionListText = "Conversation List";
// In the below selectors the i is for ignore case
var fb_ul_selector = 'ul[aria-label="' + conversionListText + '" i]';
var fb_ul_li_selector = "ul[aria-label='" + conversionListText + "' i] li";
var fb_list_selectors = 'ul[aria-label="' + conversionListText + '" i] li:not([fb_user_id]';


//const backendUrl = 'http://localhost:4400';
const backendUrl = 'http://13.232.210.23:4400';

let userAuthToken;
let sideBox = true;
let friendsCount = 0;
let friendList = [];
let tags = [];
let templates = [];
let messages = [];
let currentFriendSelected = '';

let imageToBeSend;

// Load data
chrome.storage.local.get(['userAuthToken', 'sideBox', 'friendList', 'tags', 'templates'], function(result) {
    userAuthToken = result.userAuthToken;
    if (userAuthToken != null && userAuthToken != '') {
        if (result.friendList != null)
            friendList = result.friendList;
        if (result.sideBox != null)
            sideBox = result.sideBox;
        if (result.tags != null)
            tags = result.tags;
        if (result.templates != null)
            templates = result.templates;
        
        let storageKeys = [];
        for (let i = 0; i < templates.length; i++) {
            storageKeys.push(generateKey(templates[i]));
        }
        chrome.storage.local.get(storageKeys, function(r) {
            for (let i = 0; i < templates.length; i++) {
                let key = generateKey(templates[i]);
                messages[key] = r[key];
            }
        });


        console.log(friendList);
    }
});


let $chatBox = null;
let $chatList = null;

$(document).ready(() => {
    setTimeout(() => { start() }, 600);
});


// Message listener
chrome.runtime.onMessage.addListener(
    function(message, sender, sendResponse) {
        switch(message.action) {
            case "addTag":
                console.log('addTag');
                tags.push({
                    name: message.tag,
                    color: message.color
                });
                addTag(message.tag, message.color);
            break;
            case "logout":
                console.log('loggout');
                logout();
            break;
            case "removeTag":
                console.log('removeTag');
                tags = message.tags;
                removeTag(message.tag);
            break;
            case "enableExtension": 
                console.log('Enable extension');
                userAuthToken = message.userAuthToken;
                friendList = message.friendList;
                tags = message.tags;
                templates = message.templates;
                messages = message.mess;
                for (key in message.storageKey) {
                    messages[key] = message.storageKey[key];
                }
                
                start();
            break;
            case 'selectFriend':
                console.log('selectFriend');
                selectFriend(message.friendName, message.friendId);
            break;
            case 'sendMessage':
                console.log('sendMessage');
                sendMessage(message.message);
            break;
            case 'newTemplate':
                console.log('newTemplate');
                newTemplate(message.template);
            break;
            case 'deleteTemplate':
                console.log('delete template');
                deleteTemplate(message.template);
            break;
            case 'newMessage':
                console.log('newMessage');
                newMessage(message.template, message.message);
            break;
            case 'deleteMessage':
                console.log('deleteMessage');
                deleteMessage(message.template, message.message);
            break;
            case 'editTag':
                console.log('editTag');
                editTag(message.tag, message.oldTag);
            break;
            case 'newImage':
                console.log('newImage');
                newImage(message.template, message.filename);
            break;
            case 'changeTagColor':
                console.log('changeTagColor');
                changeTagColor(message.tag, message.color);
            break;
            case 'switchSide': 
                console.log('Switch side');
                switchSide();
            break;
            case 'changeSelect':
                console.log('change seelct');
                changeSelect(message.id, message.tag);
            break;
            case 'changeTemplateOrder':
                console.log('Change template order');
                changeTemplateOrder(message.i1, message.i2);
            break;
            case 'changeMessageOrder':
                console.log('Change message order');
                changeMessageOrder(message.template, message.i1, message.i2);
            break;
        }
    }
);

function changeMessageOrder(template, i1, i2) {
    if (section == 'message') {
        let tt = $('.messages .template_name').text().trim();
        if (template === tt) {
            let $i1 = $(`.side_message_box .messages ul li:eq(${i1})`);
            let $i2 = $(`.side_message_box .messages ul li:eq(${i2})`);

            if (i1 < i2) {
                $i2.after($i1);
            } else {
                $i2.before($i1);
            }
        }
    }

    let key = generateKey(template);

    let m = messages[key];
    let tmp = m[i1];
    m.splice(i1, 1);
    m.splice(i2, 0, tmp);

    messages[key] = m;
}

function changeTemplateOrder(i1, i2) {
    let $i1 = $(`.side_message_box .templates ul li:eq(${i1})`);
    let $i2 = $(`.side_message_box .templates ul li:eq(${i2})`);

    if (i1 < i2) {
        $i2.after($i1);
    } else {
        $i2.before($i1);
    }

    let tmp = templates[i1];
    templates.splice(i1, 1);
    templates.splice(i2, 0, tmp);

    console.log(templates);
}

function changeSelect(id, tag) {
    for (let i = 0; i < friendList.length; i++) {
        if (friendList[i].id == id) {
            friendList[i].tag = tag;
            break;
        }
    }

    $('#select-' + id).val(tag);
    $('#select-' + id).trigger('change');
}

function switchSide() {
    if (sideBox == true) {
        sideBox = false;
        //$('.tag_select').css('display', 'none');
        $('.tag_select').remove();
    } else {
        sideBox = true;
        console.log('Onnn!');
        //$('.tag_select').css('display', 'block');
        let $chatList = $chatBox.find('li._5l-3 ._1qt5:not("._6zkd")');

        $chatList.each(function() {
            addSelectToFriend($(this));
        });
    }
    chrome.storage.local.set({ sideBox });
}

function changeTagColor(tag, color) {
    //console.log(tag + ", " + color);
    $selectOption = $chatBox.find(`li._5l-3 ._1qt5:not("._6zkd") select option[value='${tag}']`);
    //console.log($selectOption);
    $selectOption.css('background', color);

    $activeSelectOption = $chatBox.find(`li._5l-3 ._1qt5:not("._6zkd") select option:selected`);
    $activeSelectOption.each(function() {
        if ($(this).text().trim() == tag)
            $(this).parent().css('background', color);
    });

    for (let i = 0; i < tags.length; i++) {
        if (tags[i].name == tag) {
            tags[i].color = color;
            break;
        }
    }
}

function newImage(template, filename) {
    let key = generateKey(template);
    messages[key].push(filename);

    if (section == 'message' && $('.template_name').text().trim() == template) {
        $('.messages').append(`
            <div class="message">
                <div class="message_value" style="font-size:15px;padding:5px 8px 5px 8px;width:250px;">
                    <img src="${'http://localhost:4400/temp/' + filename}" 
                        style="width:calc(100% + 6px);margin-top:2px;">
                </div>
                <div class="message_action"  
                    style="margin-top:5px;width:20px;height:20px;margin-right:6px;display:justify-content:center;flex;align-items:center;">
                    <i class="fa fa-paper-plane send_message" style="font-size:16px;cursor:pointer;"></i>
                </div>
            </div>`
        );
    }
}

function editTag(tag, oldTag) {
    $selectOption = $chatBox.find(`li._5l-3 ._1qt5:not("._6zkd") select option[value='${oldTag}']`);
    $selectOption.attr('value', tag);
    $selectOption.text(tag);

    for (let i = 0; i < tags.length; i++) {
        if (tags[i].name == oldTag) {
            tags[i].name = tag;
        }
    }

    // Update friendList with new tag
    for (let i = 0; i < friendList.length; i++) {
        if (friendList[i].tag == oldTag) {
            friendList[i].tag = tag;
        }
    }

    chrome.storage.local.set({ friendList });
    chrome.runtime.sendMessage({ type: 'changeTag', oldTag: oldTag, newTag: tag, userAuthToken });
}

function newTemplate(template) {
    templates.push(template);

    $('.templates ul').append(`
        <li class="template">
            <div class="template_value" style="cursor:pointer;padding:5px 8px 5px 8px;font-size:15px;">
                ${template}
            </div>
        </li>`
    );

    $('.template_value').on('click', function(e) {
        e.stopPropagation();
        e.stopImmediatePropagation();

        section = 'message';
        let template = $(this).text().trim();
        let key = generateKey(template);

        $('.heading_name').html(`
            <div style="display:flex;">
                <div class="back_to_template" style="margin-right:12px;cursor:pointer;">
                    <i class="fa fa-arrow-left" style="font-size:16px;"></i>
                </div>
                <div style="font-weight:bold;">${template}</div>
            </div>`);
        let messageHtml = '';
        messageHtml += `<div class="template_name" style="display:none;">${template}</div>`;
        if (messages[key] == null) messages[key] = [];
        for (let i = 0; i < messages[key].length; i++) {
            messageHtml += `
            <div class="message">
                <div class="message_value" style="font-size:15px;padding:5px 8px 5px 8px;width:240px;">
                    ${messages[key][i]}
                </div>
                <div class="message_action" 
                style="margin-top:5px;width:20px;height:20px;margin-right:6px;display:justify-content:center;flex;align-items:center;">
                    <i class="fa fa-paper-plane send_message" style="font-size:16px;cursor:pointer;"></i>
                </div>
            </div>`;
        }


        $('.messages').html(messageHtml);
        $('.templates').css('display', 'none');
        $('.messages').css('display', 'block');

        $('.send_message').on('click', function(e) {
            console.log('send_message');
            e.stopPropagation();
            e.stopImmediatePropagation();

            let message = $(this).parent().prev().text().trim();
            console.log(message);

            sendMessage(message);
        });

        $('.back_to_template').on('click', function(e) {
            $('.heading_name').html(`<div style="font-weight:bold;margin-bottom:12px;">Templates</div>`);
            $('.messages').css('display', 'none');
            $('.templates').css('display', 'block');
            section = 'template';
        });
    });
}

function generateStyleCss(css) {
    let cssStr = '';
    for (let key in css) {
        cssStr += key + ':' + css[key] + ';'
    }
    return cssStr;
}

function deleteTemplate(template) {
    for (let i = 0; i < templates.length; i++) {
        if (templates[i] == template) {
            templates.splice(i, 1);
            break;
        }
    }

    let $children = $('.templates').children();
    $children.each(function() {
        if ($(this).find('.template_value').text().trim() == template) {
            $(this).remove();
            return false;
        }
    });
}

function deleteMessage(template, message) {
    let key = generateKey(template);
    for (let i = 0; i < messages[key].length; i++) {
        if (messages[key][i] == message) {
            messages[key].splice(i, 1);
            break;
        }
    }

    if (section == 'message' && $('.template_name').text().trim() == template) {
        $children = $('.messages').children();
        $children.each(function() {
            if ($(this).find('.message_value').text().trim() == message ||
                $(this).find('.message_value').find('img').length > 0) {
                $(this).remove();
                return false;
            }
        });
    }
}

function isUserAuthTokenDefined() {
    return userAuthToken != null && userAuthToken != '';
}

function start() {
    $chatBox = $('[aria-label="Conversation List" i]');
    $chatList = $chatBox.find('li._5l-3 ._1qt5:not("._6zkd")');

    currentFriendSelected = $('li._1ht2').find('._7st9').text().trim();

    $chatBox.arrive('li._5l-3', function() {
        let item = $(this).find('._1qt5:not("._6zkd")');
        if (item.find('.tag_select').length == 0) {
            addSelectToFriend(item);
        }
    });

    if (isUserAuthTokenDefined()) {
        $chatList.each(function() {
            addSelectToFriend($(this));
        });

        setSideMessageBox();

        setFriendListClickListener();
    }
}

function setFriendListClickListener() {
    $c = $('li._5l-3._1ht1._6zk9');
    $c.on('click', function(e) {
        e.preventDefault();
        currentFriendSelected = $(this).find('._7st9').text();
        let firstName = currentFriendSelected.substring(0,
                        currentFriendSelected.indexOf(' '));

    });
}

let sideMessageBoxOpen = false;
let section = ''; // 'message', 'template'
function setSideMessageBox() {
    $('body').css('overflow', 'hidden');
    let sideMessageSectionStyle = generateStyleCss({
        'z-index': '9999',
        width: '280px',
        height: '320px',
        overflow: 'hidden',
        display: 'block',
    });
    let sideMessageButtonStyle = generateStyleCss({
        width: '45px',
        height: '45px',
        background: 'white',
        position: 'absolute',
        right: '0',
        top: '15vh',
        'box-shadow': 'rgba(59, 59, 59, 0.41) 0px 3px 10px',
        'z-index': '9999',
        //'padding-top': '14px',
        //'padding-left': '14px',
    });
    let sideMessageBoxStyle = generateStyleCss({
        width: '300px',
        height: '70vh', //'460px',
        background: 'white',
        position: 'absolute',
        right: '-332px',
        top: 'calc(15vh + 45px)',
        transition: 'all .25s',
        padding: '16px',
        'padding-right': '12px',
        'font-size': '16px',
        'box-shadow': 'rgba(59, 59, 59, 0.41) 0px 3px 10px',
        'z-index': '9999',
    });

    section = 'template';
    const sideMessageBox = `
    <link rel="stylesheet" 
        href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/4.7.0/css/font-awesome.min.css">
    <link rel="stylesheet" href="//code.jquery.com/ui/1.12.1/themes/base/jquery-ui.css">
    <style>
        .templates::-webkit-scrollbar,
        .messages::-webkit-scrollbar {
            width: 4px;
        }
        .templates::-webkit-scrollbar-track,
        .messages::-webkit-scrollbar-track {
            background: white; /*#f1f1f1*/ 
            /* -webkit-box-shadow: inset 0 0 6px rgba(0,0,0,0.3); */
            border-radius: 10px;
        }  
        .templates::-webkit-scrollbar-thumb,
        .messages::-webkit-scrollbar-thumb {
            background: #8888884D; 
            -webkit-box-shadow: inset 0 0 6p rgba(0,0,0,0.3); 
            border-radius: 10px;
        }
        .templates::-webkit-scrollbar-thumb:hover,
        .messages::-webkit-scrollbar-thumb:hover {
            background: #55555573; 
        }

        .template {
            margin-bottom: 12px;
            background: rgb(173,216,230,.7);
            border-radius: 4px;
            margin-right: 10px;
        }
        .template:last-child {
            margin-bottom: 0;
        }
        .message {
            display: flex;
            background: rgb(173,216,230,.7);
            border-radius: 4px;
            margin-bottom:12px;
            justify-content: space-between;
            margin-right: 6px;
        }
        .message:last-child {
            margin-bottom: 0;
        }

        .templates {
            width: 100%;
            height: calc(100% - 40px);
            display: block;
            overflow-y: hidden;
        }
        .templates:hover {
            overflow-y: overlay;
        }
        .messages {
            width: 100%;
            height: calc(100% - 40px);
            display: block;
            overflow-y: hidden;
        }
        .messages:hover {
            overflow-y: overlay;
        }
    </style>
    <div class="side_message_section" style="${sideMessageSectionStyle}" disabled>
        <div class="side_message_button" style="${sideMessageButtonStyle}">
            <i class="fa fa-arrow-left" style="font-size:28px;line-height:45px;padding-left:9px;"></i>
        </div>
        <div class="side_message_box" style="${sideMessageBoxStyle}">
            <div class="heading_name" 
                style="margin-bottom:16px;display:flex;justify-content:space-between;margin-right:6px;"></div>
            <div class="templates"></div>
            <div class="messages"></div>
        </div>
    </div>`;

    $('body').append(sideMessageBox);

    $('.side_message_button').on('click', function(e) {
        if (!sideMessageBoxOpen) {
            $('.side_message_box').css({
                right: '0'
            });
            $(this)
                .find('.fa-arrow-left')
                .removeClass('fa-arrow-left')
                .addClass('fa-arrow-right');
            sideMessageBoxOpen = true;
        } else {
            $('.side_message_box').css({
                right: '-332px'
            });
            $(this)
                .find('.fa-arrow-right')
                .removeClass('fa-arrow-right')
                .addClass('fa-arrow-left');
            sideMessageBoxOpen = false;
        }
    }); 

    $('.heading_name').html(`
        <div style="font-weight:bold;">
            Templates
        </div>
    `);
    let templateHtml = '';
    for (let i = 0; i < templates.length; i++) {
        templateHtml += `
        <li class="template">
            <div class="template_value" style="cursor:pointer;padding:5px 8px 5px 8px;font-size:15px;">
                ${templates[i]}
            </div>
        </li>`;
    }

    $('.templates').append('<ul class="sortableTemplate">' + templateHtml + '</ul>');
    $('.sortableTemplate').sortable({
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
                for (let i = 0; i < tabs.length; i++) {
                    if (tabs[i].title == 'Pepper messages') { // Find pepper tab
                        chrome.tabs.sendMessage(tabs[i].id, 
                            { action: 'changeTemplateOrder', i1, i2 });
                        break;
                    }                        
                }
            });

            // Send data to background for reordering tenplate in the server
            chrome.runtime.sendMessage({ 
                type: 'reorderTemplate', 
                i1, 
                i2,
                userAuthToken,
            }); 
        }
    });

    $('.template_value').on('click', function(e) {
        e.stopPropagation();
        e.stopImmediatePropagation();

        section = 'message';
        let template = $(this).text().trim();
        let key = generateKey(template);

        $('.heading_name').html(`
            <div style="display:flex;">
                <div class="back_to_template" style="margin-right:12px;cursor:pointer;">
                    <i class="fa fa-arrow-left" style="font-size:16px;"></i>
                </div>
                <div class="template_name_for_message" style="font-weight:bold;">${template}</div>
            </div>
            <div>
                <!-- <i class="fa fa-image template_image" style="font-size:18px;cursor:pointer;"></i> -->
            </div>
        `);

        let messageHtml = '';
        messageHtml += `<div class="template_name" style="display:none;">${template}</div>`;
        if (messages[key] == null) messages[key] = [];
        for (let i = 0; i < messages[key].length; i++) {
            let main = '';
            if (messages[key][i].indexOf('--template--') < 0)
                main = messages[key][i];
            else 
                main = `<img class="message_image" src="${backendUrl + '/temp/' + messages[key][i]}" 
                    style="width:calc(100% + 6px);margin-top:2px;" crossorigin="anonymous">`;

            messageHtml = messageHtml + `
            <li class="message">
                <div class="message_value" style="font-size:15px;padding:5px 8px 5px 8px;width:250px;">` + 
                    main + 
                `</div>
                <div class="message_action" 
                style="margin-top:5px;width:20px;height:20px;margin-right:6px;display:justify-content:center;flex;align-items:center;">
                    <i class="fa fa-paper-plane send_message" style="font-style:16px;cursor:pointer;"></i>
                </div>
            </li>`;
        }


        $('.messages').html('<ul class="messageSortable">'+ messageHtml + '</ul>');
        $('.messageSortable').sortable({
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
                    for (let i = 0; i < tabs.length; i++) {
                        if (tabs[i].title === 'Pepper messages') { // Find pepper tab
                            chrome.tabs.sendMessage(tabs[i].id, 
                                { action: 'changeMessageOrder', template, i1, i2 });
                            break;
                        }                        
                    }
                });

                // Send data to background for reordering tenplate in the server
                chrome.runtime.sendMessage({ 
                    type: 'reorderMessage',
                    template, 
                    i1, 
                    i2,
                    userAuthToken,
                }); 
            }
        });
        $('.templates').css('display', 'none');
        $('.messages').css('display', 'block');

        $('.send_message').on('click', function(e) {
            e.stopPropagation();
            e.stopImmediatePropagation();

            let message = $(this).parent().prev().text().trim();
            if (message == null || message == '') {
                message = $(this).parent().prev().find('img').attr('src');
                imageToBeSend = $(this).parent().prev().find('img').get(0);
            }

            sendMessage(message);
        });

        $('.back_to_template').on('click', function(e) {
            $('.heading_name').html(`
                <div style="font-weight:bold;">
                    Templates
                </div>
            `);
            $('.messages').css('display', 'none');
            $('.templates').css('display', 'block');
            section = 'template';
        });
    });
}

function templateValueClickListener(e) {    
    e.stopPropagation();
    e.stopImmediatePropagation();

    section = 'message';
    let template = $(this).text().trim();
    let key = generateKey(template);

    $('.heading_name').html(`
        <div style="display:flex;">
            <div class="back_to_template" style="margin-right:12px;">B</div>
            <div style="font-weight:bold;">${template}</div>
        </div>`);
    let messageHtml = '';
    messageHtml += `<div class="template_name" style="display:none;">${template}</div>`;
    if (messages[key] == null) messages[key] = [];
    for (let i = 0; i < messages[key].length; i++) {
        messageHtml += `
        <div class="message">
            <div class="message_value" style="font-size:15px;padding:5px 8px 5px 8px;">
                ${messages[key][i]}
            </div>
            <div class="message_action" 
            style="margin-top:5px;width:20px;height:20px;margin-right:6px;display:justify-content:center;flex;align-items:center;">
                <img class="send_message" src="${chrome.runtime.getURL("images/send.png")}" 
                    style="width:100%;height:100%;cursor:pointer;">
            </div>
        </div>`;
    }


    $('.messages').html(messageHtml);
    $('.templates').css('display', 'none');
    $('.messages').css('display', 'block');

    $('.send_message').on('click', function(e) {
        console.log('send_message');
        e.stopPropagation();
        e.stopImmediatePropagation();

        let message = $(this).parent().prev().text().trim();
        console.log(message);

        sendMessage(message);
    });

    $('.back_to_template').on('click', function(e) {
        $('.heading_name').html(`<div style="font-weight:bold;margin-bottom:12px;">Templates</div>`);
        $('.messages').css('display', 'none');
        $('.templates').css('display', 'block');
        section = 'template';
    });
}

function newMessage(template, message) {
    console.log('new messageeeee');
    let key = generateKey(template);
    if (messages[key] == null) messages[key] = [];
    messages[key].push(message);

    if (section == 'message' && $('.template_name').text().trim() == template) {
        $('.messages').append(`
            <li class="message" style="margin-top:12px;">
                <div class="message_value" style="font-size:15px;padding:5px 8px 5px 8px;width:240px;">
                    ${message}
                </div>
                <div class="message_action"  
                    style="margin-top:5px;width:20px;height:20px;margin-right:6px;display:justify-content:center;flex;align-items:center;">
                    <i class="fa fa-paper-plane send_message" style="font-size:16px;cursor:pointer;"></i>
                </div>
            </li>`
        );
    }
}

function generateKey(str) {
    return str.replace(/ /g, '-');
}


let optionStyle = `color:white;padding:4px;`;
function addSelectToFriend(item) {
    
    let friendName = item.find('span').text();

    $a = item.closest('a._2il3');
    //$a = item.closest('._5l-3._1ht5');
    let id = $a.attr('data-href').split('/t/')[1];//.replace(/./g, '0');
    //let id = $a.attr('data-testid').split(':')[1];
    $a.closest('li').attr('fb_user_id', id);

    let flag = false;
    let options = '';
    let o = {};
    o.id = id;
    for (let i = 0; i < friendList.length; i++) {
        options = '';
        if (friendList[i].name == friendName) {
            let tag = friendList[i].tag;

            for (let j = 0; j < tags.length; j++) {
                if (tags[j].name == tag) {
                    o.color = tags[j].color;
                    options += `<option style="background:${tags[j].color};${optionStyle}" value="${tags[j].name}" selected>
                        ${tags[j].name}</option>`;
                } else {  
                    options += `<option style="background:${tags[j].color};${optionStyle}" value="${tags[j].name}">${tags[j].name}</option>`;
                }
            }
            appendSelectAndAddListener(item, options, o);
            flag = true;
            break;
        }
    }

    if (!flag) {
        for (let j = 0; j < tags.length; j++) {
            options += `<option style="background:${tags[j].color};${optionStyle}" value="${tags[j].name}">${tags[j].name}</option>`;
        }
        appendSelectAndAddListener(item, options, o);
    }
}


function appendSelectAndAddListener(item, options, o) {
    let selectStyle = `width:100px;margin-right:4px;margin-left:4px;appearance:none;`;
    let s = '';
    if (o.color != null && o.color != '') s = `background:${o.color};color:white;`; 

    if (sideBox) selectStyle += 'display:block;';
    else selectStyle += 'display:none;';

    item.html(item.html() + //o.id.replace(/\./g, 'a')
        `<select id="select-${o.id}" class="tag_select" style="${selectStyle}${s}">
            <option>...</option>
            ${options}
        </select>`);

    $('.tag_select').on('change', function(e) {
        console.log('change');
        e.stopPropagation();
        e.stopImmediatePropagation();

        let friendId = $(this).attr('id').split('-')[1];
        console.log('Addind id = ', friendId);
        let friendName = $(this).prev().text().trim();
        let friendImageUrl = $(this).parent().parent().prev().find('img').attr('src');
        let tag = $(this).val();

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

        // Send data to background for saving to the server
        chrome.runtime.sendMessage({ 
            type: 'addTagToFriend', 
            friendId, 
            friendName, 
            tag, 
            friendImageUrl,
            userAuthToken,
        }); 
    });
}

function addTag(tag, color) {
    console.log(tag);
    $chatList = $chatBox.find('li._5l-3 ._1qt5:not("._6zkd")');
    $chatList.each(function() {
        let $select = $(this).find('select');
        $select.append(`<option class="option" style="background:${color};color:white;" value="${tag}">${tag}</option>`)
    });
}

function removeTag(tag) {
    $selectOption = $chatBox.find(`li._5l-3 ._1qt5:not("._6zkd") select option[value='${tag}']`);
    $selectOption.remove();

    // Update friendList to '...' i.e no tag
    let spliceIndex = [];
    for (let i = 0; i < friendList.length; i++) {
        if (friendList[i].tag == tag) {
            console.log('ID = ', friendList[i].id);
            console.log($('#select-' + friendList[i].id));
            $('#select-' + friendList[i].id).css({
                background: 'white',
                'color': 'black'
            });
            spliceIndex.push(i);
            chrome.runtime.sendMessage({ type: 'addTagToFriend', friendName: friendList[i].name, tag: '...'}); 
        }
    }
    while(spliceIndex.length) {
        friendList.splice(spliceIndex.pop(), 1);
    }
}

function getFriendKey(friendName) {
    return friendName.trim().replace(/\ /g, '-');
}

function logout() {
    $chatList.each(function() {
        $(this).find('select').remove();
    });
    $('.side_message_section').remove();
}

function selectFriend(friendName, friendId) {
    console.log('using tabs update', friendId);
    //chrome.tabs.update({ url: "https://facebook.com/messages/t/" + friendId });
    window.location.replace("https://facebook.com/messages/t/" + friendId);
    return;

    $chatList.each(function() {
        if ($(this).find('span').text() == friendName) {
            $(this).trigger('click');
            $(this).mclick();
            return false;
        }
    });



}

async function loadBlob(fileName) {
    const fetched = await fetch(fileName);
    return await fetched.blob();
}
  

async function sendMessage(templateMessage) {
    // const url = 'https://upload.wikimedia.org/wikipedia/commons/5/53/Google_Chrome_Material_Icon-450x450.png';
    // const blobInput = await loadBlob(url);
  	// const clipboardItemInput = new ClipboardItem({'image/png' : blobInput});
    // await navigator.clipboard.write([clipboardItemInput]);
    // return;

    let firstName = currentFriendSelected.substring(0, 
                    currentFriendSelected.indexOf(' '));
    templateMessage = templateMessage.replace('NAME', firstName);

    let c = 0;
    selector = 'div[aria-label="New message"] div[contenteditable="true"] span br';
    if ($(selector).length > 0) {
        let messageBox = $('._4rv3._7og6[aria-label="New message"]');

        $('.__i_').mclick();
        $('#js_1').mclick();

        console.log(templateMessage);
        if (templateMessage.indexOf('--template--') >= 0) {
            let c = document.createElement('canvas');
            //let img = document.querySelector(".message_image");
            let imgWidth = imageToBeSend.naturalWidth;
            let imgHeight = imageToBeSend.naturalHeight;
            c.width = imgWidth;
            c.height = imgHeight;
            let ctx = c.getContext("2d");
            ctx.drawImage(imageToBeSend, 0, 0, imgWidth, imgHeight);
            let bb = c.toBlob(async (blob) => {
                console.log(blob);
                let clipboardItemInput = new ClipboardItem({'image/png': blob});
                await navigator.clipboard.write([clipboardItemInput]);
                document.execCommand('paste');
            }, 'image/png', 0.95);

            //let url = 'https://upload.wikimedia.org/wikipedia/commons/5/53/Google_Chrome_Material_Icon-450x450.png';
            // let url = templateMessage;
            // let extension = url.substring(url.lastIndexOf('.') + 1);
            // let blobInput = await loadBlob(url);
            // let mimeType = 'image/' + extension;
            // let obj = {};
            // obj[mimeType] = blobInput;
            // let clipboardItemInput = new ClipboardItem({[blobInput.type]: blobInput});
            // await navigator.clipboard.write([clipboardItemInput]);
            // document.execCommand('paste');
        } else {
            var evt = new Event('input', { bubbles: true });
            let input = document.querySelector(selector);
            input.innerHTML = templateMessage;
            input.dispatchEvent(evt);
            $(selector).after('<span data-text="true">' + templateMessage + '</span>');

            let loc = window.location.href;
            loc = loc.split("/t/");
            $next = $(fb_ul_selector + " li[fb_user_id='" + loc[1] + "']").next('li').find('a');
            $prev = $(fb_ul_selector + " li[fb_user_id='" + loc[1] + "']").prev('li').find('a');
            let flag = true;
            if ($next.length > 0) {
                $next.mclick();
                flag = true;
            } else {
                $prev.mclick();
                flag = false;
            }
            setTimeout(function() {
                let loc1 = window.location.href;
                loc1 = loc1.split("/t/");
                $next = $(fb_ul_selector + " li[fb_user_id='" + loc1[1]+"']").next('li').find('a');
                $prev = $(fb_ul_selector + " li[fb_user_id='" + loc1[1]+"']").prev('li').find('a');
                if (flag) $prev.mclick();
                else $next.mclick();
            }, 100);
        }
    } else {
        console.log('Message already typed in the message box');
    }
}