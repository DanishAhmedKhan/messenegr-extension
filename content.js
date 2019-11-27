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
    'vchange': function () {
        var change_event = document.createEvent('HTMLEvents')
        change_event.initEvent('change', false, true)
        return $(this).each(function () {
            $(this)[0].dispatchEvent(change_event)
        })
    },
    'vclick': function () {
        var click_event = document.createEvent('HTMLEvents')
        click_event.initEvent('click', false, true)
        return $(this).each(function () {
            $(this)[0].dispatchEvent(click_event)
        })
    },
    'vblur': function () {
        var click_event = document.createEvent('HTMLEvents')
        click_event.initEvent('blur', false, true)
        return $(this).each(function () {
            $(this)[0].dispatchEvent(click_event)
        })
    },
    'vkeyup': function () {
        var keyup_event = document.createEvent('HTMLEvents')
        keyup_event.initEvent('keyup', false, true)
        return $(this).each(function () {
            $(this)[0].dispatchEvent(keyup_event)
        })
    },
    'vkeyupWithChar': function (key) {
        var specific_keyup_event = document.createEvent('HTMLEvents')
        specific_keyup_event.initEvent('keyup', false, true)
        specific_keyup_event.which = key;
        specific_keyup_event.keyCode = key;
        return $(this).each(function () {
            $(this)[0].dispatchEvent(specific_keyup_event)
        })
    }
})



var conversionListText = "Conversation List";

var fb_ul_selector = "ul[aria-label='"+conversionListText+"']";
var fb_ul_li_selector = "ul[aria-label='"+conversionListText+"'] li";
var fb_list_selectors = "ul[aria-label='"+conversionListText+"'] li:not([fb_user_id]";



const backendUrl = 'http://192.168.0.104:4400';

let friendsCount = 0;
let friendList = [];
let tags = [];
let userAuthToken;

// Load user auth token and friendList
chrome.storage.sync.get(['userAuthToken', 'friendList', 'tags'], function(result) {
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
                //sendMessage(message.message);
                sendMessage(message.message);
            break;
        }
    }
);


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

    $chatLi = $chatBox.find('li div._5l-3._1ht5');
    $chatLi.each(function() {
        //console.log($(this));
        let id = $(this).find('a._2il3').attr('data-href').split('/t/')[1];
        //console.log(id);
        $(this).parent().attr('fb_user_id', id);
    });

    if (isUserAuthTokenDefined()) {
        $chatList.each(function() {
            addSelectToFriend($(this));
        });
    }
}

let optionStyle = `color:white;padding:4px;`;
function addSelectToFriend(item) {
    let friendName = item.find('span').text();

    let flag = false;
    let options = '';
    let o = {};
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
        `<select id="${friendsCount}" class="tag_select" style="${selectStyle}${s}">
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

        let friendId = $(this).closest('li').attr('fb_user_id');
        console.log(fbId);
        let friendName = $(this).prev().text();
        let friendImageUrl = $(this).parent().parent().prev().find('img').attr('src');
        console.log(friendImageUrl);
        let tag = $(this).val();

        for (let i = 0; i < tags.length; i++) {
            if (tags[i].name == tag) {
                $(this).css({
                    'background': tags[i].color,
                    'color': 'white',
                });
            }
        }

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
        chrome.runtime.sendMessage({ type: 'addTagToFriend', friendId, friendName, tag: tag, friendImageUrl }); 
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
    console.log($selectOption);
    $selectOption.parent().css({
        background: 'white',
        'color': 'black'
    });
    $selectOption.remove();

    // Update friendList to '...' i.e no tag
    let spliceIndex = [];
    for (let i = 0; i < friendList.length; i++) {
        if (friendList[i].tag == tag) {
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
    selector = 'div[aria-label="New message"] div[contenteditable="true"] span br';
    if ($(selector).length > 0) {
        var evt = new Event('input', { bubbles: true });
        var input = document.querySelector(selector);
        input.innerHTML = templateMessage;
        input.dispatchEvent(evt);
        $(selector).after('<span data-text="true">'+templateMessage+'</span>');
        var loc = window.location.href;
        loc = loc.split("/t/");
        //$(fb_ul_selector+" li[fb_user_id='"+loc[1]+"']").next('li').find('a').mclick();
        $next = $(fb_ul_selector+" li[fb_user_id='"+loc[1]+"']").next('li').find('a');
        $prev = $(fb_ul_selector+" li[fb_user_id='"+loc[1]+"']").prev('li').find('a');
        let flag = true;
        if ($next.length > 0) {
            $next.mclick();
            flag = true;
        } else {
            $prev.mclick();
            flasg = false;
        }
        setTimeout(function() {
            var loc1 = window.location.href;
            loc1 = loc1.split("/t/");
            $next = $(fb_ul_selector+" li[fb_user_id='"+loc1[1]+"']").next('li').find('a');
            $prev = $(fb_ul_selector+" li[fb_user_id='"+loc1[1]+"']").prev('li').find('a');
            if (flag) $prev.mclick();
            else $next.mclick();
            setTimeout(function() {
                $('._38lh').mclick();
            }, 100);
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
  