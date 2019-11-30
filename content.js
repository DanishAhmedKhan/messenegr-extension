console.log('Hello from messenger extension!');


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

var fb_ul_selector = 'ul[aria-label="' + conversionListText + '"]';
var fb_ul_li_selector = "ul[aria-label='" + conversionListText + "'] li";
var fb_list_selectors = 'ul[aria-label="' + conversionListText + '"] li:not([fb_user_id]';



const backendUrl = 'http://192.168.0.102:4400';

let userAuthToken;
let friendsCount = 0;
let friendList = [];
let tags = [];
let templates = [];
let messages = [];

// Load user auth token and friendList
chrome.storage.sync.get(['userAuthToken', 'friendList', 'tags', 'templates'], function(result) {
    userAuthToken = result.userAuthToken;
    if (userAuthToken != null && userAuthToken != '') {
        if (result.friendList != null)
            friendList = result.friendList;
        if (result.tags != null)
            tags = result.tags;
        if (result.templates != null)
            templates = result.templates;
        
        let storageKeys = [];
        for (let i = 0; i < templates.length; i++) {
            storageKeys.push(generateKey(templates[i]));
        }
        chrome.storage.sync.get(storageKeys, function(r) {
            for (let i = 0; i < templates.length; i++) {
                let key = generateKey(templates[i]);
                messages[key] = r[key];
            }
            console.log(messages);
        });
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
                
                start();
            break;
            case 'selectFriend':
                console.log('selectFriend');
                selectFriend(message.friendName);
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
        }
    }
);

function newTemplate(template) {
    $('.templates').append(`
        <div class="template" style="margin-top:10px;">
            <div class="template_value" style="cursor:pointer;">
                ${template}
            </div>
        </div>`
    );
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
            if ($(this).find('.message_value').text().trim() == message) {
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
    $chatBox = $('[aria-label="Conversation List"]');
    $chatList = $chatBox.find('li._5l-3 ._1qt5:not("._6zkd")');

    $chatBox.arrive('li._5l-3', function() {
        let item = $(this).find('._1qt5:not("._6zkd")');
        if (item.first().next().length == 0)
            addSelectToFriend(item);
    });

    if (isUserAuthTokenDefined()) {
        $chatList.each(function() {
            addSelectToFriend($(this));
        });
    }

    setSideMessageBox();
}

let sideMessageBoxOpen = false;
let section = '';
function setSideMessageBox() {
    $('body').css('overflow', 'hidden');
    let sideMessageSectionStyle = generateStyleCss({
        'z-index': '9999',
        width: '250px',
        height: '320px',
        overflow: 'hidden',
        display: 'block',
    });
    let sideMessageButtonStyle = generateStyleCss({
        width: '55px',
        height: '55px',
        background: 'white',
        position: 'absolute',
        right: '0',
        top: '25vh',
        'box-shadow': 'rgba(59, 59, 59, 0.41) 0px 3px 10px',
    });
    let sideMessageBoxStyle = generateStyleCss({
        width: '250px',
        height: '320px',
        background: 'white',
        position: 'absolute',
        right: '-282px',
        top: 'calc(25vh + 55px)',
        transition: 'all .25s',
        padding: '16px',
        'font-size': '16px',
        'box-shadow': 'rgba(59, 59, 59, 0.41) 0px 3px 10px',
    });

    section = 'template';
    const sideMessageBox = `
    <div class="side_message_section" style="${sideMessageSectionStyle}" disabled>
        <div class="side_message_button" style="${sideMessageButtonStyle}">
        </div>
        <div class="side_message_box" style="${sideMessageBoxStyle}">
            <div class="templates" style="width:100%;display:block;"></div>
            <div class="messages" style="width:100%;display:none;"></div>
        </div>
    </div>`;

    $('body').append(sideMessageBox);

    $('.side_message_button').on('click', function(e) {
        if (!sideMessageBoxOpen) {
            $('.side_message_box').css({
                right: '0'
            });
            sideMessageBoxOpen = true;
        } else {
            $('.side_message_box').css({
                right: '-282px'
            });
            sideMessageBoxOpen = false;
        }
    }); 

    templateHtml = '<div style="font-weight:bold;">Templates</div>';
    for (let i = 0; i < templates.length; i++) {
        templateHtml += `
        <div class="template" style="margin-top:10px;">
            <div class="template_value" style="cursor:pointer;">
                ${templates[i]}
            </div>
        </div>`;
    }

    $('.templates').html(templateHtml);
    $('.template_value').on('click', function(e) {
        e.stopPropagation();
        e.stopImmediatePropagation();

        section = 'message';
        let template = $(this).text().trim();
        let key = generateKey(template);

        let messageHtml = `
        <div style="display:flex;">
            <div class="back_to_template" style="margin-right:16px;">B</div>
            <div style="font-weight:bold;">Message (${template})</div>
        </div>`;
        messageHtml += `<div class="template_name" style="display:none;">${template}</div>`;
        if (messages[key] == null) messages[key] = [];
        for (let i = 0; i < messages[key].length; i++) {
            messageHtml += `
            <div class="message" style="margin-top:10px;display:flex;justify-content:space-between;">
                <div class="message_value">
                    ${messages[key][i]}
                </div>
                <div class="message_action" style="width:20px;height:20px;margin-right:6px;">
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
            // chrome.tabs.getAllInWindow(null, function(tabs) {
            //     for (let i = 0; i < tabs.length; i++) {
            //         // Find messenger tab
            //         if (tabs[i].title == 'Messenger') {
            //             chrome.tabs.sendMessage(tabs[i].id, { action: 'sendMessage', message });
            //             break;
            //         }                        
            //     }
            // });
        });

        $('.back_to_template').on('click', function(e) {
            $('.messages').css('display', 'none');
            $('.templates').css('display', 'block');
            section = 'template';
        });
    });
}

function newMessage(template, message) {
    console.log('new messageeeee');
    let key = generateKey(template);
    messages[key].push(message);

    if (section == 'message' && $('.template_name').text().trim() == template) {
        console.log('in the section');
        $('.messages').append(`
            <div class="message" style="margin-top:10px;display:flex;justify-content:space-between;">
                <div class="message_value">
                    ${message}
                </div>
                <div class="message_action" style="width:20px;height:20px;margin-right:6px;">
                    <img class="send_message" src="${chrome.runtime.getURL("images/send.png")}" 
                        style="width:100%;height:100%;cursor:pointer;">
                </div>
            </div>`
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
    let id = $a.attr('data-href').split('/t/')[1];
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

let selectStyle = `width:100px;margin-right:4px;margin-left:4px;appearance:none;`;
function appendSelectAndAddListener(item, options, o) {
    let s = '';
    if (o.color != null && o.color != '') s = `background:${o.color};color:white;`; 

    item.html(item.html() + 
        `<select id="select-${o.id}" class="tag_select" style="${selectStyle}${s}">
            <option>...</option>
            ${options}
        </select>`);

    // $('.tag_select').on('click', function(e) {
    //     e.stopPropagation();
    //     e.stopImmediatePropagation();
    //     console.log('click on select');
    // });

    $('.tag_select').on('change', function(e) {
        console.log('change');
        e.stopPropagation();
        e.stopImmediatePropagation();

        let friendId = $(this).attr('id').split('-')[1];
        console.log('Addind id = ', friendId);
        let friendName = $(this).prev().text();
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
            if (!flag) friendList.push({ id: friendId, name: friendName, tag: tag, imageUrl: friendImageUrl });
        }
        console.log('friendList');
        console.log(friendList);
        chrome.storage.sync.set({ friendList });

        // Send data to background for saving to the server
        chrome.runtime.sendMessage({ type: 'addTagToFriend', friendId, friendName, tag, friendImageUrl }); 
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
            $('#' + friendList[i].id).css({
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
}

function selectFriend(friendName) {
    $chatList.each(function() {
        if ($(this).find('span').text() == friendName) {
            console.log('name found');
            console.log($(this));
            $(this).trigger('click');
            return false;
        }
    });
}

function sendMessage(templateMessage) {
    console.log('bigatron');
    console.log(templateMessage);
    let c = 0;
    selector = 'div[aria-label="New message"] div[contenteditable="true"] span br';
    if ($(selector).length > 0) {
        $('.__i_').mclick();
        $('#js_1').mclick();
        console.log(c++);
        var evt = new Event('input', { bubbles: true });
        let input = document.querySelector(selector);
        console.log(evt);
        console.log(input);
        input.innerHTML = templateMessage;
        console.log(c++);
        input.dispatchEvent(evt);
        console.log(c++);
        $(selector).after('<span data-text="true">'+templateMessage+'</span>');
        console.log(c++);
        var loc = window.location.href;
        loc = loc.split("/t/");
        $next = $(fb_ul_selector + " li[fb_user_id='" + loc[1]+"']").next('li').find('a');
        $prev = $(fb_ul_selector + " li[fb_user_id='" + loc[1]+"']").prev('li').find('a');
        let flag = true;
        if ($next.length > 0) {
            $next.mclick();
            console.log(c++);
            flag = true;
        } else {
            $prev.mclick();
            console.log(c++);
            flag = false;
        }
        setTimeout(function() {
            console.log(c++);
            var loc1 = window.location.href;
            loc1 = loc1.split("/t/");
            console.log(loc1);
            $next = $(fb_ul_selector + " li[fb_user_id='" + loc1[1]+"']").next('li').find('a');
            $prev = $(fb_ul_selector + " li[fb_user_id='" + loc1[1]+"']").prev('li').find('a');
            if (flag) $prev.mclick();
            else $next.mclick();
            // setTimeout(function() {
            //     console.log(c++);
            //     $('._38lh').mclick();
            // }, 100);
        }, 100);
    } else {
        console.log('Message already typed in the message box');
    }
}

function sendMessage2(note) {
    $textInputBox = $('._5rpb ._1mf span');
    $textInputBox.trigger('click');
    console.log($textInputBox);
    $textInputBox.html(`<span data-text="true">${note}</span>`)
    // let $navFocus = $('._kmc._7kpg.navigationFocus');
    // console.log($navFocus);
    // $navFocus.trigger('click');
    // let $bb = $('._5rp7._5rp8');
    // console.log($bb);
    //$bb.trigger('click');
    // $placeholder = $('._1p1t');
    // $placeholder.remove();
    // $main = $('._5rpu');
    // $main.trigger('click');
    // console.log($main);
    // $a = $('._7kpk');
    // $a.trigger('click');
    // console.log($a);

    // for (let i = 0; i < note.length; i++) {
    //     simulateKeyPress(note.charAt(i));
    // }

    $send = $('._30yy._7kpj');
    console.log($send);
    $send.attr({
        'aria-label': 'Send',
        'data-hover': 'tooltip',
        'data-tooltip-content': 'Press enter to send\nPress Shift+Enter to add a new paragraph',

    });
    $send.removeAttr('title');
    $send.removeClass('_5j_u _4rv9 _6ymq _7kpj').addClass('_38lh _7kpi');

    $send.html(`
        <svg height="36px" width="36px" viewBox="0 0 36 36">
            <g fill="none" fill-rule="evenodd">
                <g>
                    <polygon points="0 36 36 36 36 0 0 0"></polygon>
                    <path d="M31.1059281,19.4468693 L10.3449666,29.8224462 C8.94594087,30.5217547 
                    7.49043432,29.0215929 8.17420251,27.6529892 C8.17420251,27.6529892 10.7473302,22.456697 
                    11.4550902,21.0955966 C12.1628503,19.7344961 12.9730756,19.4988922 20.4970248,18.5264632 
                    C20.7754304,18.4904474 21.0033531,18.2803547 21.0033531,17.9997309 C21.0033531,17.7196073 
                    20.7754304,17.5095146 20.4970248,17.4734988 C12.9730756,16.5010698 12.1628503,16.2654659 
                    11.4550902,14.9043654 C10.7473302,13.5437652 8.17420251,8.34697281 8.17420251,8.34697281 
                    C7.49043432,6.9788693 8.94594087,5.47820732 10.3449666,6.1775158 L31.1059281,16.553593 
                    C32.298024,17.1488555 32.298024,18.8511065 31.1059281,19.4468693" fill="#0099ff"></path>
                </g>
            </g>
        </svg>
    `);
}

function sendMessage3(templateMessage) {
    console.log('my message');
    var pathname = window.location.pathname.toString();
    if (pathname.indexOf('/inbox/') > -1) {
        console.log('INBOX');
        var sendPageMessage = templateMessage;
        selector = '._1p7p._5id1._4dv_._58al.uiTextareaAutogrow';
        if($(selector).length > 0){
            var evt = new Event('input', {
                        bubbles: true  
                    });
            var input = document.querySelector(selector);
            input.innerHTML = templateMessage;
            input.dispatchEvent(evt);
        }
            $('._4jy0._4jy3._4jy1._51sy.selected').mclick();
    } else {
        selector = 'div[aria-label="New message"] div[contenteditable="true"] span br';
        if($(selector).length > 0){
            var evt = new Event('input', {
                        bubbles: true  
                    });
            var input = document.querySelector(selector);
            input.innerHTML = templateMessage;
            input.dispatchEvent(evt);
            $(selector).after('<span data-text="true">'+templateMessage+'</span>');
            var loc = window.location.href;
            loc = loc.split("/t/");
            console.log('loc', loc[1]);
            console.log($('._38lh'));
            $(fb_ul_selector+" li[fb_user_id='"+loc[1]+"']").next('li').find('a').mclick();
            setTimeout(function() {
                var loc1 = window.location.href;
                loc1 = loc1.split("/t/");
                $(fb_ul_selector+" li[fb_user_id='"+loc1[1]+"']").prev('li').find('a').mclick();
                setTimeout(function() {
                    $('._38lh').mclick();
                }, 100);
            }, 100);
            //$('._38lh').mclick();
            
            //console.log($(fb_ul_selector+" li[fb_user_id='"+loc[1]+"']").next('li').find('a'));

            //$next = $(fb_ul_selector+" li[fb_user_id='"+loc[1]+"']").next('li').find('a');
            //$prev = $(fb_ul_selector+" li[fb_user_id='"+loc[1]+"']").prev('li').find('a');

            //if ($next.length > 0) $next.mclick();
            //else $prev.mclick();

            // setTimeout(function() {
            //     $(fb_ul_selector+" li[fb_user_id='"+loc[1]+"']").mclick();
                
            // }, 200);

            


            return;
            setTimeout(function(){
                var loc1 = window.location.href;
                loc1 = loc1.split("/t/");
                $(fb_ul_selector+" li[fb_user_id='"+loc1[1]+"']").prev('li').find('a').mclick();
                console.log($(fb_ul_selector+" li[fb_user_id='"+loc1[1]+"']").prev('li').find('a'));
                setTimeout(function(){
                    $('div[aria-label="New message"]').find('a[role="button"]').mclick();
                    console.log($('div[aria-label="New message"]').find('a[role="button"]'));
                    /*******************/
                    var loc = window.location.href;
                    loc = loc.split("/t/");
                    $(fb_ul_selector+" li[fb_user_id='"+loc[1]+"']").next('li').find('a').mclick();
                    console.log($(fb_ul_selector+" li[fb_user_id='"+loc[1]+"']").next('li').find('a'));
                    setTimeout(function(){
                        var loc1 = window.location.href;
                        loc1 = loc1.split("/t/");
                        $(fb_ul_selector+" li[fb_user_id='"+loc1[1]+"']").prev('li').find('a').mclick();
                    },200);
                    /*******************/
                },200);
            },200);
        } else {
            console.log('NOT SELECTOR');
            $('div[aria-label="New message"] div[contenteditable="true"] span span').text(templateMessage);
            $('div[aria-label="New message"]').find('a[role="button"]').mclick();
            /*******************/
            var loc = window.location.href;
            loc = loc.split("/t/");
            $(fb_ul_selector+" li[fb_user_id='"+loc[1]+"']").next('li').find('a').mclick();
            setTimeout(function(){
                var loc1 = window.location.href;
                loc1 = loc1.split("/t/");
                $(fb_ul_selector+" li[fb_user_id='"+loc1[1]+"']").prev('li').find('a').mclick();
            },200);
            /*******************/
        }

    }
}

function sendMessage4(templateMessage){
    var pathname = window.location.pathname.toString();
    if (pathname.indexOf('/inbox/') > -1) {
        var sendPageMessage = templateMessage;
        selector = '._1p7p._5id1._4dv_._58al.uiTextareaAutogrow';
        if($(selector).length > 0){
            var evt = new Event('input', {
                        bubbles: true  
                    });
            var input = document.querySelector(selector);
            input.innerHTML = templateMessage;
            input.dispatchEvent(evt);
        }
         $('._4jy0._4jy3._4jy1._51sy.selected').mclick();
    } else {
        selector = 'div[aria-label="New message"] div[contenteditable="true"] span br';
        if($(selector).length > 0){
            var evt = new Event('input', {
                        bubbles: true  
                    });
            var input = document.querySelector(selector);
            input.innerHTML = templateMessage;
            input.dispatchEvent(evt);
            $(selector).after('<span data-text="true">'+templateMessage+'</span>');
            var loc = window.location.href;
            loc = loc.split("/t/");
            $(fb_ul_selector+" li[fb_user_id='"+loc[1]+"']").next('li').find('a').mclick();
            setTimeout(function(){
                var loc1 = window.location.href;
                loc1 = loc1.split("/t/");
                $(fb_ul_selector+" li[fb_user_id='"+loc1[1]+"']").prev('li').find('a').mclick();
                setTimeout(function(){
                    $('div[aria-label="New message"]').find('a[role="button"]').mclick();
                    /*******************/
                    var loc = window.location.href;
                    loc = loc.split("/t/");
                    $(fb_ul_selector+" li[fb_user_id='"+loc[1]+"']").next('li').find('a').mclick();
                    setTimeout(function(){
                        var loc1 = window.location.href;
                        loc1 = loc1.split("/t/");
                        $(fb_ul_selector+" li[fb_user_id='"+loc1[1]+"']").prev('li').find('a').mclick();
                    },100);
                    /*******************/
                },100);
            },100);
        } else {
            $('div[aria-label="New message"] div[contenteditable="true"] span span').text(templateMessage);
            $('div[aria-label="New message"]').find('a[role="button"]').mclick();
            /*******************/
            var loc = window.location.href;
            loc = loc.split("/t/");
            $(fb_ul_selector+" li[fb_user_id='"+loc[1]+"']").next('li').find('a').mclick();
            setTimeout(function(){
                var loc1 = window.location.href;
                loc1 = loc1.split("/t/");
                $(fb_ul_selector+" li[fb_user_id='"+loc1[1]+"']").prev('li').find('a').mclick();
            },100);
            /*******************/
        }

    }
}

function sendMessage5(templateMessage) {
    selector = 'div[aria-label="New message"] div[contenteditable="true"] span br';
			if($(selector).length > 0){
                $('.js_1').mclick();
				var evt = new Event('input', {
							bubbles: true  
						});
				var input = document.querySelector(selector);
				input.innerHTML = templateMessage;
				input.dispatchEvent(evt);
				$(selector).after('<span data-text="true">'+templateMessage+'</span>');
				var loc = window.location.href;
				loc = loc.split("/t/");
				$(fb_ul_selector+" li[fb_user_id='"+loc[1]+"']").next('li').find('a').mclick();
				setTimeout(function(){
					var loc1 = window.location.href;
					loc1 = loc1.split("/t/");
					$(fb_ul_selector+" li[fb_user_id='"+loc1[1]+"']").prev('li').find('a').mclick();
					setTimeout(function(){
						$('div[aria-label="New message"]').find('a[role="button"]').mclick();
						/*******************/
						var loc = window.location.href;
						loc = loc.split("/t/");
						$(fb_ul_selector+" li[fb_user_id='"+loc[1]+"']").next('li').find('a').mclick();
						setTimeout(function(){
							var loc1 = window.location.href;
							loc1 = loc1.split("/t/");
							$(fb_ul_selector+" li[fb_user_id='"+loc1[1]+"']").prev('li').find('a').mclick();
						},200);
						/*******************/
					},200);
				},200);
			} else {
				$('div[aria-label="New message"] div[contenteditable="true"] span span').text(templateMessage);
				$('div[aria-label="New message"]').find('a[role="button"]').mclick();
				/*******************/
				var loc = window.location.href;
				loc = loc.split("/t/");
				$(fb_ul_selector+" li[fb_user_id='"+loc[1]+"']").next('li').find('a').mclick();
				setTimeout(function(){
					var loc1 = window.location.href;
					loc1 = loc1.split("/t/");
					$(fb_ul_selector+" li[fb_user_id='"+loc1[1]+"']").prev('li').find('a').mclick();
				},200);
				/*******************/
			}
}

function simulateKeyPress(character) {
    console.log('char  = ', character);
    //jQuery.event.trigger({ type : 'keypress', which : character.charCodeAt(0) });

    console.log($('._5rpu'));

    var e = $.Event('keypress');
    e.which = 65; // Character 'A'
    $('._5rpu').trigger(e);
    $('._1mf').trigger(e);
    $('._5rpb').trigger(e);
    $('._5rp7._5rp8').trigger(e);
    
}
  