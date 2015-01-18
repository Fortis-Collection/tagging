function searchTags(tagTerm, pageNumber, filter) {

    function ajaxRequest() {
        var activexmodes = ["Msxml2.XMLHTTP", "Microsoft.XMLHTTP"]; //activeX versions to check for in IE
        if (window.ActiveXObject) { //Test for support for ActiveXObject in IE first (as XMLHttpRequest in IE7 is broken)
            for (var i = 0; i < activexmodes.length; i++) {
                try {
                    return new ActiveXObject(activexmodes[i]);
                }
                catch (e) {
                    //suppress error
                }
            }
        }
        else if (window.XMLHttpRequest) // if Mozilla, Safari etc
            return new XMLHttpRequest();
        else
            return false
    }

    var mygetrequest = new ajaxRequest();

    mygetrequest.onreadystatechange = function () {
        var tagArray = [];
        if (mygetrequest.readyState == 4) {
            if (mygetrequest.status == 200 || window.location.href.indexOf("http") == -1) {
                var responseParsed = eval('(' + mygetrequest.responseText + ')');
                var tags = responseParsed.items;

                for (i = 0; i < tags.length; i++) {
                    var newTagID = '{"tagID":"' + tags[i].ItemId + '",';
                    var newTagDisplayText = '"tagDisplayText":"' + tags[i].Name + '",';
                    var bucketValue = '"tagBucket":"' + tags[i].Bucket + '",';
                    var newTagLanguage = '"tagLanguage":"' + tags[i].Language + '",';
                    var newTagtagPopularity = '"tagPopularity":"unknown"}';
                    var newTagObject = jQuery.parseJSON(newTagID + newTagDisplayText + bucketValue + newTagLanguage + newTagtagPopularity);
                    tagArray.push(newTagObject);
                }
            }
            populateSuggestedTagsDiv(tagArray);
        }
    }

    mygetrequest.open("GET", "/sitecore/shell/Applications/Buckets/Services/Search.ashx?fromBucketListField=" + tagTerm + '&pageNumber=' + pageNumber + filter, true);
    mygetrequest.send(null);
}


//Setup functions on page load

//dummy data & functions
function dummyReturnNewTagID(tagText) {
    tempID = random = Math.ceil(Math.random() * 1000);
    return "{" + tempID + "}";
}

//Tag input functions
TagField = function (_fieldRootId, _hiddenAppliedIdsDiv, _appliedDisplayNameDiv, _addTagButton, _userInputDiv, _suggestedTagsDiv, _filter, _messagesDiv) {
    var filter = _filter;

    var fieldRootId = _fieldRootId;
    var tagFieldRoot = jQuery(_fieldRootId);
    //Tag Suggestion Setup
    //These variables will be set from the arguments passed
    var hiddenAppliedIdsDiv = _hiddenAppliedIdsDiv; //the div that will contain the hidden id of the applied tags
    var appliedDisplayNameDiv = _appliedDisplayNameDiv; //the div that will contain the display text of the applied tags
    var addTagButton = _addTagButton; //the button the user clicks to add a tag
    var userInputDiv = _userInputDiv; //the input that the user will enter text into
    var messagesDiv = _messagesDiv || null; //the div messages will be added into

    var suggestedTagsDiv = _suggestedTagsDiv; //the div that will contain the suggested tags

    var charactersBeforeSuggestions = 1; //how many characters should the user enter before suggestions are made
    var newTagsAllowed = true; //value should be true or false - is the user allowed to create their own new tags(true), or only allowed to use suggested tags(false)

    if (messagesDiv === null) {
        var messagesAllowed = false;
    }
    else {
        var messagesAllowed = true;
    }

    //messages values;
    var msgnewTagsAllowedFalse = "You do not have permission to create new tags, please use suggested tags";
    var msgTagAdded = " tag has been added"; //tag display text to be displayed first
    var msgNoTagsFound = "No tags have been found";
    var msgTagAlreadyAdded = " tag is already added"; //tag display text to be displayed first
    var msgTagRemoved = "Tag removed";
    var msgNoTextEntered = "Please type in a tag, or select a suggested tag";

    var appliedTagsArray = []; //an array of json tag objects
    var suggestedTagsArray = []; //an array of suggested json tag objects


    var closeButtonHtml = '<a href="#" class="addedTagItemCloseBtn"><' + '/a>';

    //displays helpfull messages to user if messages allowed
    //function argument possibilities:
    //	displayMessageToUser([a message selected from possible messages, or a custom message], [a string that will appear before the message])
    //		eg. ("thisIsATagValue", msgTagAlreadyAdded)   will display: | thisIsATagValue tag is already added
    //	displayMessageToUser([a message selected from possible messages, or a custom message])
    //		eg. (msgNoTextEntered)   will display: | Please type in a tag, or select a suggested tag
    //	displayMessageToUser()
    //		will clear the message
    displayMessageToUser = function (msgValue, tagDisplayText) {
        if (messagesAllowed) {
            tagDisplayText = tagDisplayText || "";
            msgValue = msgValue || " ";
            if (msgValue === " ") {
                tagFieldRoot.find(messagesDiv).html(" ");
                tagFieldRoot.find(messagesDiv).css({ 'display': 'none' });
            }
            else {
                tagFieldRoot.find(messagesDiv).css({ 'display': 'inline-block' });
                tagFieldRoot.find(messagesDiv).html(tagDisplayText + msgValue);
            }
        }
    }

    setCurrentFieldRoots = function (fieldRoot) {
        tagFieldRoot = fieldRoot;
        appliedTagsArray = [];
        grabAddedTags();
        displayMessageToUser();
    }

    jQuery(fieldRootId).hover(function () {
        setCurrentFieldRoots(jQuery(this));
    });

    //adds suggested tags to the suggested tags list
    //takes array of JSON objects
    populateSuggestedTagsDiv = function (tagArray) {
        suggestedTagsArray = tagArray;
        if (suggestedTagsArray !== null) {
            tagFieldRoot.find(suggestedTagsDiv).find('.suggestedTagItem').remove();
            tagFieldRoot.find(".closebtn").css({ 'display': 'none' });
            tagFieldRoot.find('.tagSuggestionBox_wrap').css({ 'display': 'none' });
            for (var i = 0; i < suggestedTagsArray.length; i++) {
                tagFieldRoot.find('.tagSuggestionBox_wrap').css({ 'display': 'block' });
                tagFieldRoot.find(suggestedTagsDiv).append('<span class="suggestedTagItem" data-displayText="' + suggestedTagsArray[i].tagDisplayText + '">' + suggestedTagsArray[i].tagDisplayText + " (Language: " + suggestedTagsArray[i].tagLanguage + " | Bucket: " + suggestedTagsArray[i].tagBucket + ')<' + '/span>');
                tagFieldRoot.find('.closebtn').css({ 'display': 'block' });

                tagFieldRoot.find(suggestedTagsDiv).find('.suggestedTagItem:nth-child(' + (i + 1) + ')').hover(function (event) {
                    tagFieldRoot.find(suggestedTagsDiv).find('.suggestedTagItem').removeClass("hover mouseHover");
                    tagFieldRoot.find(this).addClass("hover mouseHover");
                }, function (event) { tagFieldRoot.find(suggestedTagsDiv).find('.suggestedTagItem').removeClass("hover mouseHover"); });


                tagFieldRoot.find(suggestedTagsDiv).find('.suggestedTagItem:nth-child(' + (i + 1) + ')').click(function (event) {
                    event.preventDefault();
                    addThisTag = jQuery(this).attr("data-displayText");
                    tagFieldRoot.find(userInputDiv).val(addThisTag);
                    tagFieldRoot.find(suggestedTagsDiv).find('.suggestedTagItem').remove();
                    tagFieldRoot.find(".closebtn").css({ 'display': 'none' });
                    tagFieldRoot.find('.tagSuggestionBox_wrap').css({ 'display': 'none' });
                    tagFieldRoot.find(userInputDiv).focus();
                });
            }
        }

    }

    getTagSuggestions = function (userInputString) {
        searchTags(userInputString, 1, filter);//aString(the user input) gets passed, and an array of JSON objects of suggested tags gets returned
    }


    addNewTag = function (userInputString) {
        //*NOTE: JASONS CODE HERE//
        //*****USE userInputString AS THE NEW TAG DISPLAY TEXT*****//
        //*****PUT THE CORRECT DATA TO REPLACE dummyReturnNewTagID(userInputString) *****//		
        var newTagID = '{"tagID":"' + dummyReturnNewTagID(userInputString) + '",'; //<--Replace Here
        var newTagDisplayText = '"tagDisplayText":"' + userInputString + '"}';
        var newTagObject = jQuery.parseJSON(newTagID + newTagDisplayText);
        return newTagObject;
    }

    //checks to see if the tag is in the added tags list 
    //takes string, returns JSON object or false	
    checkTagAlreadyAdded = function (userInputString) {
        var tagAlreadyAdded = false;
        if (appliedTagsArray === null || appliedTagsArray === undefined || appliedTagsArray.length < 0) { }//empty if because IE 9 doesn't like !==
        else {
            for (var i = 0; i < appliedTagsArray.length; i++) {
                if (appliedTagsArray[i].tagDisplayText === userInputString) {
                    tagAlreadyAdded = true;
                }
            }
        }
        return tagAlreadyAdded;
    }

    //checks to see if the tag is in the suggested tags list 
    //takes string, returns JSON object or false
    checkTagInSuggestedList = function (userInputString) {
        var tagInSuggestList = false;
        if (suggestedTagsArray === null || suggestedTagsArray === undefined || suggestedTagsArray.length < 0) { }//empty if because IE 9 doesn't like !==
        else {
            for (var i = 0; i < suggestedTagsArray.length; i++) {
                if (suggestedTagsArray[i].tagDisplayText === userInputString) {
                    tagInSuggestList = suggestedTagsArray[i];
                }
            }

        }
        return tagInSuggestList;
    }

    //clears and then re-populates the hidden id div and tag text fields with updated tags added
    populateTagDivs = function () {
        if (appliedTagsArray === null || appliedTagsArray === undefined || appliedTagsArray.length < 1) {
            tagFieldRoot.find(hiddenAppliedIdsDiv).val("");
            tagFieldRoot.find(appliedDisplayNameDiv).find(".addedTagItem").remove();
        }
        else {
            var tagIdDivStringVal = "";

            tagFieldRoot.find(appliedDisplayNameDiv).find(".addedTagItem").remove();
            for (var i = 0; i < appliedTagsArray.length; i++) {

                tagFieldRoot.find(appliedDisplayNameDiv).append('<span data-id="' + appliedTagsArray[i].tagID + '" class="addedTagItem"><span class="displayText">' + appliedTagsArray[i].tagDisplayText + '<' + '/span>' + closeButtonHtml + '<' + '/span>');

                if (i == 0) {
                    tagIdDivStringVal = appliedTagsArray[i].tagID;
                }
                else {
                    tagIdDivStringVal = tagIdDivStringVal + "|" + appliedTagsArray[i].tagID;
                }
            }
            tagFieldRoot.find(hiddenAppliedIdsDiv).val(tagIdDivStringVal);

            for (var i = 0; i < appliedTagsArray.length + 1; i++) {
                tagFieldRoot.find(appliedDisplayNameDiv).find('.addedTagItem:nth-child(' + (i + 1) + ')').find('.addedTagItemCloseBtn').bind("click", function () {
                    removeTagButtonClicked(jQuery(this).parent());
                });
            }

            //tagFieldRoot.find(appliedDisplayNameDiv).find('.addedTagItemCloseBtn').each(function() {
            //    jQuery(this).bind("click", function() {
            //        removeTagButtonClicked(jQuery(this).parent());
            //    });
            //});
        }
    }

    //on load, grabs the tags that have already been added
    grabAddedTags = function () {
        tagFieldRoot.find(appliedDisplayNameDiv).find(".addedTagItem").each(function () {
            // *NOTE: if backend populates a different div with the tag names, change '.selectbox' 
            // if div that gets populated is the same div passed in for _appliedDisplayNameDiv, change '.selectbox' to appliedDisplayNameDiv
            var newTagObject = jQuery.parseJSON('{"tagID":"' + jQuery(this).attr('data-id') + '",' + '"tagDisplayText":"' + jQuery(this).find('.displayText').html() + '"}');
            appliedTagsArray.push(newTagObject);
        });
        populateTagDivs();

    }

    //takes the clicked remove button's parent div, addedTagItem
    removeTagButtonClicked = function (clickedTagItem) {
        var removeDisplayText = clickedTagItem.find('.displayText').html();
        for (var i = 0; i < appliedTagsArray.length; i++) {
            if (appliedTagsArray[i].tagDisplayText === removeDisplayText) {
                appliedTagsArray.splice(i, 1);
            }
        }
        populateTagDivs();
    }

    addTagButtonClicked = function (userInputString) {
        //check to see if the tag has already been added, we don't want repeating tags	
        if (checkTagAlreadyAdded(userInputString)) {
            //the tag has been added, if messages are allowed, the user will be informed
            displayMessageToUser(msgTagAlreadyAdded, userInputString);
        }
            //the tag has not yet been added
        else {
            var addTagObject = false;
            //if the tag is in the suggested tags list, we'll pull the details from there
            var tagInSuggestList = checkTagInSuggestedList(userInputString);
            if ((suggestedTagsArray !== null || suggestedTagsArray !== undefined || suggestedTagsArray.length > 0) && tagInSuggestList !== false) {
                addTagObject = tagInSuggestList;
            }
                //the tag suggestion list is either empty, or none of them match
                //the tag has not already been added, and it hasn't been suggested, so a new tag needs to be made
            else {
                //check if the user is allowed to add new tags
                if (newTagsAllowed === false) {
                    //the user isnt allowed to add new tags, if messages are allowed, the user will be informed
                    displayMessageToUser(msgnewTagsAllowedFalse);
                }
                else {
                    //a new tag will now be created
                    addTagObject = addNewTag(userInputString);
                }
            }
            //if a tag was pulled from the suggested list, or created, we need to add it
            if (addTagObject !== false) {
                if (appliedTagsArray === null || appliedTagsArray === undefined || appliedTagsArray.length < 1) {
                    //there's no tags yet added, so lets add the first one
                    appliedTagsArray = [addTagObject];
                }
                else {
                    //add the new tag to the lis of tags already added
                    appliedTagsArray.push(addTagObject);
                }
                populateTagDivs(); //still runs if new tag & allowed = null
            }

        }
        tagFieldRoot.find(userInputDiv).val("");
        suggestedTagsArray = [];
    }

    checkUserInputString = function (uis) {
        if (uis.length < 1 || uis === "" || uis === " " || uis === undefined) {
            tagFieldRoot.find(addTagButton).removeClass('notEmpty');
        }
        else {
            tagFieldRoot.find(addTagButton).addClass('notEmpty');
        }
    }

    jQuery(addTagButton).click(function (event) {
        event.preventDefault();
        displayMessageToUser();
        tagFieldRoot.find(suggestedTagsDiv).find('.suggestedTagItem').remove();
        tagFieldRoot.find('.tagSuggestionBox_wrap').css({ 'display': 'none' });
        checkUserInputString(" ");
        userInputString = tagFieldRoot.find(userInputDiv).val();
        if (userInputString === null || userInputString === undefined || userInputString === "" || userInputString === " ") {
            displayMessageToUser(msgNoTextEntered);
        }
        else {
            addTagButtonClicked(userInputString);
        }
    });

    jQuery(".closebtn").click(function () {
        displayMessageToUser();
        jQuery(this).css({ 'display': 'none' });
        tagFieldRoot.find(suggestedTagsDiv).find('.suggestedTagItem').remove();
        tagFieldRoot.find('.tagSuggestionBox_wrap').css({ 'display': 'none' });
    });

    jQuery(userInputDiv).keyup(function (event) {
        displayMessageToUser();
        var userInputString = jQuery(this).val();
        //up
        if (event.keyCode == 38) {
            event.preventDefault();
            var mh = false;
            var th = false;
            tagFieldRoot.find(suggestedTagsDiv).find(".suggestedTagItem").each(function () {
                if (jQuery(this).hasClass('mouseHover')) {
                    mh = true;
                }
                else if (jQuery(this).hasClass('hover')) {
                    th = true;
                }
            });
            if (mh === false && suggestedTagsArray.length > 0) {
                if (th === false) { hoverElement = suggestedTagsArray.length; }
                else {
                    for (var i = 1 ; i < suggestedTagsArray.length + 1; i++) {
                        var target = "'.suggestedTagItem:nth-child(" + (i) + ")'";
                        if (tagFieldRoot.find(target).hasClass('hover')) {
                            tagFieldRoot.find(target).removeClass('hover');
                            if (i - 1 === 0) {
                                hoverElement = i;
                            }
                            else {
                                hoverElement = i - 1;
                            }
                        }

                    }
                }
                tagFieldRoot.find("'.suggestedTagItem:nth-child(" + (hoverElement) + ")'").addClass('hover');
            }
        }
            //down
        else if (event.keyCode == 40) {
            event.preventDefault();
            var mh = false;
            var th = false;
            tagFieldRoot.find(suggestedTagsDiv).find(".suggestedTagItem").each(function () {
                if (jQuery(this).hasClass('mouseHover')) {
                    mh = true;
                }
                else if (jQuery(this).hasClass('hover')) {
                    th = true;
                }
            });
            if (mh === false && suggestedTagsArray.length > 0) {
                if (th === false) { hoverElement = 1; }
                else {
                    for (var i = 1 ; i < suggestedTagsArray.length + 1; i++) {
                        var target = "'.suggestedTagItem:nth-child(" + (i) + ")'";
                        if (tagFieldRoot.find(target).hasClass('hover')) {
                            tagFieldRoot.find(target).removeClass('hover');
                            if (i + 1 === suggestedTagsArray.length + 1) {
                                hoverElement = i;
                            }
                            else {
                                hoverElement = i + 1;
                            }
                        }

                    }
                }
                tagFieldRoot.find("'.suggestedTagItem:nth-child(" + (hoverElement) + ")'").addClass('hover');
            }
        }
            //enter
        else if (event.keyCode == 13) {
            checkUserInputString(userInputString);
            th = false;
            for (var i = 1; i < suggestedTagsArray.length + 1; i++) {
                if (tagFieldRoot.find("'.suggestedTagItem:nth-child(" + (i) + ")'").hasClass('hover')) {

                    tagFieldRoot.find("'.suggestedTagItem:nth-child(" + (i) + ")'").css({ 'border': '1px solid red' })
                    th = tagFieldRoot.find("'.suggestedTagItem:nth-child(" + (i) + ")'");

                }
            }
            if ((suggestedTagsArray.length < 1 || th === false) && tagFieldRoot.find(addTagButton).hasClass('notEmpty')) {
                tagFieldRoot.find(addTagButton).click();
            }
            else if (th !== false) {
                addThisTag = th.attr("data-displayText");
                tagFieldRoot.find(userInputDiv).val(addThisTag);
                tagFieldRoot.find(suggestedTagsDiv).find('.suggestedTagItem').remove();
                tagFieldRoot.find(".closebtn").css({ 'display': 'none' });
                tagFieldRoot.find('.tagSuggestionBox_wrap').css({ 'display': 'none' });
                tagFieldRoot.find(userInputDiv).focus();
            }

        }
            //escape
        else if (event.keyCode == 27) {
            if (suggestedTagsArray.length > 0 && tagFieldRoot.find('.closebtn').css('display') !== 'none') {
                tagFieldRoot.find('.closebtn').click();
                tagFieldRoot.find(userInputDiv).focus();
            }
            else { tagFieldRoot.find(userInputDiv).val(""); }

        }
        else {

            checkUserInputString(userInputString);
            if (userInputString.length >= charactersBeforeSuggestions) {
                getTagSuggestions(userInputString);
            }
        }
    });

    //setCurrentFieldRoots(jQuery(fieldRootId));
    checkUserInputString(" ");
    displayMessageToUser();
    grabAddedTags();
}