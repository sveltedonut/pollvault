//database reference and variables
var ref = new Firebase("https://pv1.firebaseio.com");
var readRef = ref.child("posts").limitToLast(20);
var scrollState = 1;
var authData = ref.getAuth();
var uid = "";
var answersRef;
var answers;

//auth callback
ref.onAuth(updateAuth);

//update user info
function updateAuth(authData) {
    $("#login").empty();
    if (authData) {
        console.log(authData);
        jQuery('<a/>', {
            href : "#",
            class : "btn-antisocial",
            text: authData["facebook"]["displayName"] + " - Logout"
        }).appendTo("#login");
        console.log("logged in");
        uid = authData.uid;
        answersRef = ref.child("users").child(uid).child("answers");
        answersRef.once("value", answersReturn);
    }
    else {
        jQuery('<a/>', {
            href : "#",
            class : "btn-social",
            text: "Login using Facebook"
        }).appendTo("#login");
        console.log("logged out");
        uid = "";
        answers = {};
        readRef.once("value", show);
    }
}

//login button
$('#login').on('click', '.btn-social', function (e) {
    ref.authWithOAuthPopup("facebook", function(error) {
        if (error) {
            console.log("Login Failed!", error);
        } else {
            // We'll never get here, as the page will redirect on success.
        }
    });
    authData = ref.getAuth();
});

//logout button
$('#login').on('click', '.btn-antisocial', function (e) {
    ref.unauth();
    authData = ref.getAuth();
});

//Attach callback for reading posts and answers
readRef.on("value", show);

//show answers
function answersReturn(data){
    console.log("answers updated");
    answers = data.val();
    readRef.once("value", show);
}

//show newest posts
function show(snapshot) {
    var posts = snapshot.val();
    $("#newposts").empty();
    $("#posts").empty();
    for (var postid in posts) {
        showChoices(posts, postid, '#newposts');
    }
    console.log("posts updated");
    return false;
}

//show individual post
function showChoices(posts, postid, containerId) {
    var post = posts[postid];
    
    if (answers != undefined) {
        if (answers[postid] != null) {
            showClosedChoices(post, posts, postid, containerId)
        }
        else {
            showOpenChoices(post, posts, postid, containerId)
        }
    }
    else {
        showOpenChoices(post, posts, postid, containerId)
    }
}

//show open choice post
function showOpenChoices(post, posts, postid, containerId) {
    jQuery('<ul/>', {
        id : postid,
        class : "list-group"
    }).prependTo(containerId);

    jQuery('<li/>', {
        id : "question" + postid,
        class : "list-group-item",
        text : post["question"]
    }).appendTo("#" + postid);
    $("#question" + postid).wrapInner("<h4></h4>");

    var choices = post["choices"];

    for (var choice in choices) {
        jQuery('<a/>', {
            id : choice + postid,
            class : "list-group-item " + postid,
            text : choices[choice]["text"],
            onclick : "answer(\"" + choice + "\", \"" + postid + "\"); return false;"
        }).appendTo("#" + postid);
    }
}

//show closed choice post
function showClosedChoices(post, posts, postid, containerId) {
    jQuery('<ul/>', {
        id : postid,
        class : "list-group"
    }).prependTo(containerId);

    jQuery('<li/>', {
        id : "question" + postid,
        class : "list-group-item",
        
        text : post["question"]
    }).appendTo("#" + postid);
    $("#question" + postid).wrapInner("<h4></h4>");

    var choices = post["choices"];
    var totalCount = 0;
    
    for (var choice in choices) {
        totalCount += choices[choice]["count"];
    }

    for (var choice in choices) {
        var color = "default";
        if (choice == answers[postid]) {
            color = "primary";
        }
        jQuery('<a/>', {
            id : choice + postid,
                text : choices[choice]["text"],
            class : "list-group-item list-group-item-" + color + " " + postid,
        }).appendTo("#" + postid);
        
        jQuery('<div/>', {
            id : "data-" + choice + postid,
            class : "col-xs-8 pull-right " + postid,
        }).appendTo("#" + choice + postid);
        
        jQuery('<div/>', {
            id : "progress-" + choice + postid,
            class : "progress " + postid,
        }).appendTo("#data-" + choice + postid);
        
        var percentage = Number(((choices[choice]["count"]/totalCount)*100).toFixed(1));
        
        if (choice == answers[postid]) {
            jQuery('<div/>', {
                id: "bar-" + choice + postid,
                class : "progress-bar progress-bar-info",
                role : "progressbar",
                style : "width: " + percentage + "%;",
                "aria-valuenow" : choices[choice]["count"],
                "aria-valuemin" : 0,
                "aria-valuemax" : totalCount
            }).appendTo("#progress-" + choice + postid);
        }
        
        else {
            jQuery('<div/>', {
                id: "bar-" + choice + postid,
                class : "progress-bar progress-bar-default",
                role : "progressbar",
                style : "width: " + percentage + "%;",
                "aria-valuenow" : choices[choice]["count"],
                "aria-valuemin" : 0,
                "aria-valuemax" : totalCount
            }).appendTo("#progress-" + choice + postid);
        }
    }
}

//infinite scroll
$(window).scroll(function() {
    if ($(window).scrollTop() == $(document).height() - $(window). height()) {
        var oldReadRef = ref.child("posts").limitToLast((scrollState += 1)*20);
        oldReadRef.on("value", showOld);
    }
});

//show older posts (used with infinite scroll)
function showOld(snapshot) {
    //console.log(snapshot.val());
    var posts = snapshot.val();
    
    jQuery('<div/>', {
        id : "posts" + scrollState
    }).appendTo("#posts");
    
    var i = 0;
    for (var postid in posts) {
        if (i == 20) {
            break;
        }
        
        if ($("#" + postid).length == 0) {
            showChoices(posts, postid, "#posts" + scrollState);
            i++;
        }
    }
}

//answering question
function answer(choice, id) {
    ref.child("posts").child(id).child("choices").child(choice).child("count").transaction(function (count) {
        return count + 1;
    });
    ref.child("users").child(uid).child("answers").child(id).set(choice);
    $("." + id).removeAttr("onclick");
    $("." + id).addClass("list-group-item-default");
    $("#" + choice + id).removeClass("list-group-item-default");
    $("#" + choice + id).addClass("list-group-item-primary");
    
    var countRef = ref.child("posts").child(id).child("choices");
    countRef.once("value", updateBar);
    
    function updateBar(data) {
        choices = data.val();
        console.log(choices);
        var totalCount = 0;
        for (var pchoice in choices) {
            totalCount += choices[pchoice]["count"];
        }
        console.log(totalCount);
        
        for (var pchoice in choices) {
            jQuery('<div/>', {
                id : "data-" + pchoice + id,
                class : "col-xs-8 pull-right " + id,
            }).appendTo("#" + pchoice + id);

            jQuery('<div/>', {
                id : "progress-" + pchoice + id,
                class : "progress " + id,
            }).appendTo("#data-" + pchoice + id);

            var percentage = Number(((choices[pchoice]["count"]/totalCount)*100).toFixed(1));

            if (choice == pchoice) {
                jQuery('<div/>', {
                    id: "bar-" + pchoice + id,
                    class : "progress-bar progress-bar-info",
                    role : "progressbar",
                    style : "width: " + percentage + "%;",
                    "aria-valuenow" : choices[pchoice]["count"],
                    "aria-valuemin" : 0,
                    "aria-valuemax" : totalCount
                }).appendTo("#progress-" + pchoice + id);
            }

            else {
                jQuery('<div/>', {
                    id: "bar-" + pchoice + id,
                    class : "progress-bar progress-bar-default",
                    role : "progressbar",
                    style : "width: " + percentage + "%;",
                    "aria-valuenow" : choices[pchoice]["count"],
                    "aria-valuemin" : 0,
                    "aria-valuemax" : totalCount
                }).appendTo("#progress-" + pchoice + id);
            }
        }
        if (authData) {
            answersRef.once("value", answersReturn);
        }
    }
}
       
//submit function
$(function() {
    $("#submit").submit(function(e) {
        
        //Prevent refresh
        e.preventDefault();
        
        //Store form values
        var values = {};
        $.each($('#submit').serializeArray(), function(i, field) {
            values[field.name] = field.value;
        });
        
        //push values to firebase
        var postRef = ref.child("posts");
        var newPostRef = postRef.push();
        //set values for new post
        newPostRef.set({
            question : values["question"],
            choices : {
                choice1 : {
                    text : values["choice1"],
                    count : 0
                },
                choice2 : {
                    text : values["choice2"],
                    count : 0
                }
            }
        });
        if (values["choice3"]) {
            newPostRef.child("choices").child("choice3").set({
                text : values["choice3"],
                count: 0
            });
        }
        if (values["choice4"]) {
            newPostRef.child("choices").child("choice4").set({
                text : values["choice4"],
                count: 0
            });
        }
    
        //clear form
        $(this)[0].reset();
    });
});