var slides = 19;
var sqls = [];
var loginData = undefined;
var isDragging = false;

function currentIndex() {
    return $("#toc>.active").index();
}
function openLoginModal() {
    $("#completeLogin").prop("disabled", false);
    $("#completeLogin").text("Login");
    $("#loginModal").modal({backdrop: 'static', keyboard: false});
    $("#completeLogin").click(function() {
        var username = $("input[name=username]").val();
        var password = $("input[name=password]").val();
        if (username == "" || password == "") return;
        $("#completeLogin").prop("disabled", true);
        $("#completeLogin").text("Logging in...");
        console.log($("#externalCheck:checked").val())
        console.log(($("#externalCheck:checked").val()?'http://78.104.62.3':'http://10.10.0.8:5560')+'/isqlplus/login.uix')
        $.ajax({
            async: true,
            type: 'POST',
            cache: false,
            crossDomain: true,
            url: ($("#externalCheck:checked").val()?'http://78.104.62.3':'http://10.10.0.8:5560')+'/isqlplus/login.uix',
            headers: {'Content-Type': 'application/x-www-form-urlencoded'},
            contentType: 'application/x-www-form-urlencoded; charset=utf-8',
            data: {
                username: username,
                password: password,
                connectID: "",
                event: "login"
            },
            timeout: 7000,
            xhrFields: {
                withCredentials: true
            },
            success: function(e) {
                if (e.includes("invalid username/password; logon denied")) {
                    alert("Invalid credentials")
                    $("#completeLogin").prop("disabled", false);
                    $("#completeLogin").text("Login");
                }
                else if (e.includes("<td align=\"center\"><a href=\"/isqlplus/workspace.uix?event=logout\"><span class=\"xq\">Abmelden</span></a></td>"))
                {
                    $("#loginModal").modal('hide');
                    loginData = true;
                }
                else
                {
                    alert("Unknown error. Check console")
                    console.log(e)
                    $("#completeLogin").prop("disabled", false);
                    $("#completeLogin").text("Login");
                }
            },
            error: function(e) {
                alert("Error.\nAre you using Firefox?\nHave you installed Cors Everywhere?\nIs the Cors-E logo green in the addon bar?\nAre you using a private window?\nIs iSQL+ offline?")
                $("#completeLogin").prop("disabled", false);
                $("#completeLogin").text("Login");
            }
        });
    });
}

$(document).ready(function(e) {
    $("#loginForm").submit(function(e) {
        e.preventDefault();
    })
    $("#sqlForm").submit(function(e) {
        e.preventDefault();
        if (loginData == undefined)
        {
            $("#sqlout").text("Press F5 to login");
            return;
        }

        $("#sqlout").text("")
        $.ajax({
            async: false,
            type: 'POST',
            url: ($("#externalCheck:checked").val()?'http://78.104.62.3':'http://10.10.0.8:5560')+'/isqlplus/workspace.uix',
            headers: {'Content-Type': 'application/x-www-form-urlencoded'},
            contentType: 'application/x-www-form-urlencoded; charset=utf-8',
            cache: false,
            crossDomain: true,
            data: {
                script: "SET SERVEROUTPUT ON;\n" + $("#sqlin textarea").val(),
                event: "execute"
            },
            xhrFields: {
                withCredentials: true
            },
            success: function(data) {
                $("#sqlout").html("<div class=\"output\">"+data.replace(/^.*?<div class="output">(.*?)<\/div>.*?$/s,"$1")+"</div>");
            }
        });
    })
    openLoginModal();
    for (var i = 0; i < slides; i++) {
        $.ajax({
            async: false,
            type: 'GET',
            url: 'pages/'+i+'.html',
            cache: false,
            success: function( data ) {
                var sql = $(data).filter('sql').text();
                sqls[i] = { init: sql, text: sql };
                $(".carousel-inner").append("<div class=\"carousel-item h-100"+(i==0?" active":"")+"\" id=\""+(i)+"\"><div>"+data.replace(/^.*?<body>(.*?)<\/body>.*?$/s,"$1")+"</div></div>");
                $("#toc").append(
                    "<a class=\"list-group-item list-group-item-action"+(i==0?" active":"")+"\" href=\"#"+(i)+"\">"+($(data).filter('title').text())+"</a>");
            }
        })
    }

    $("#toc>a").click(function() {
        $("#presentationControls").carousel($(this).index())
    })
    $("#fullscreen").click(function() {
        document.getElementById("presentation").requestFullscreen();
    })
    $("#drag").draggable({
        axis: "y",
        scroll: false,
        drag: function( event, ui){
            var offset = $(this).offset();
            var yPos = offset.top;
            var percentage = yPos/$(window).height()*100;
            var percent = percentage + "%";
            var percent2 = 100-percentage + "%";
            $("#firstrow").css("height", percent);
            $("#secondrow").css("height", percent2);
        }
    });
    $("#presentationControls").on('slide.bs.carousel', function(e) {
        $("#toc>a").each(function() {
            $(this).removeClass("active")
        });
        $("#toc>a:nth-child("+(e.to+1)+")").addClass("active")
        $("#sqlin textarea").val(sqls[e.to].text);
    })
    
    $(document.body).on('keydown',function(e) {
        if ($("#sqlin textarea").is(":focus")) return;
        if (e.which == 39) {
            $("#presentationControls").carousel('next')
        }
        if (e.which == 37) {
            $("#presentationControls").carousel('prev')
        }
    })

    $("#sqlin textarea").bind('input propertychange', function() {
        sqls[currentIndex()].text = $("#sqlin textarea").val();
    })

    $("#reset").click(function () {
        $("#resetModal").modal();
    })

    $("#completeReset").click(function () {
        var index = currentIndex()
        sqls[index].text = sqls[index].init;
        $("#sqlin textarea").val(sqls[index].text);
    })

    $("#sqlin textarea").val(sqls[0].text);


    function getDelay(){
        var date = new Date();
        var hour = date.getMinutes();
        return (60 - hour) * 60 * 1000; //get the milliseconds until the next full hour
    }
    
    delay = getDelay();
    var dynamicInterval = function(){
        clearInterval(interval); //stop the current interval
        delay = getDelay();
        interval = setInterval(dynamicInterval, delay); //set the new interval with the new delay
        openLoginModal();
    }
    var interval = setInterval(dynamicInterval, delay); //initial start of the interval
    
})
