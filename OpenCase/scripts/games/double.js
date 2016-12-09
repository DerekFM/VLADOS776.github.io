
var numbers = [1, 14, 2, 13, 3, 12, 4, 0, 11, 5, 10, 6, 9, 7, 8];
var colors = ['r', 'b', 'r', 'b', 'r', 'b', 'r', 'g', 'b', 'r', 'b', 'r', 'b', 'r', 'b'];
var botMinDec = 700,
    botMaxDec = 3000,
    botMinBet = 1,
    botMaxBet = 1000,
    betLimit = 1000000;
var timerBots,
    intervalCountdown,
    winNumber = 40,
    winNum,
    countdownTime = 25000,
    countdownTimer = countdownTime,
    gameStart = false,
    playerBet = [];
var maxItems = 30;

var caseScrollAudio = new Audio();
caseScrollAudio.src = "../sound/scroll.wav";
//caseScrollAudio.loop = true;
caseScrollAudio.playbackRate = 1;
caseScrollAudio.volume = 0.2;


$(function() {
    var lastGames = getLastGames(10);
    var lastGamesHTML = "";
    for (var i = 0; i < lastGames.length; i++)
        lastGamesHTML += "<div class='" + lastGames[i].color + "-ball inline ball'>" + lastGames[i].number + "</div>";
    $(".last-games").html(lastGamesHTML);

    $('#bet').val('0');
    $('#balance').text(Player.doubleBalance.toFixed(0));
    $('#menu_doubleBalance').text(Player.doubleBalance.toFixed(0));

    $("#bet").keydown(function(e) {
        // Allow: backspace, delete, tab, escape, enter and .
        if ($.inArray(e.keyCode, [46, 8, 9, 27, 13, 110, 190]) !== -1 ||
            // Allow: Ctrl+A
            (e.keyCode == 65 && e.ctrlKey === true) ||
            // Allow: Ctrl+C
            (e.keyCode == 67 && e.ctrlKey === true) ||
            // Allow: Ctrl+X
            (e.keyCode == 88 && e.ctrlKey === true) ||
            // Allow: home, end, left, right
            (e.keyCode >= 35 && e.keyCode <= 39)) {
            // let it happen, don't do anything
            return;
        }
        // Ensure that it is a number and stop the keypress
        if ((e.shiftKey || (e.keyCode < 48 || e.keyCode > 57)) && (e.keyCode < 96 || e.keyCode > 105)) {
            e.preventDefault();
        }
    });

    newGame();
});

function newGame() {
    gameStart = false;
    $('.bet-to-color').prop('disabled', false);

    playerBet = [];

    fillCarusel(parseInt($(".ball:first-child").text()));

    botMaxBet = Player.doubleBalance + 1000 > betLimit ? betLimit : Player.doubleBalance + 1000;

    countdownTimer = countdownTime;
    $('.the-bet').fadeOut(300, function() {
        $(this).remove();
    });

    timerBots = setTimeout(function() {
        botAddBet()
    }, Math.rand(botMinDec, botMaxDec));
    countDown();
}

function countDown() {
    clearTimeout(intervalCountdown);
    countdownTimer -= 100;
    val = (countdownTimer * 100) / countdownTime;
    $('#progress-countdown').css('width', val + '%');
    $('.big-progress span').text(Localization.double2.rollingIn[Settings.language] + ' ' + (countdownTimer / 1000).toFixed(1) + '...');

    if (val > 0) {
        intervalCountdown = setTimeout(countDown, 100);
    } else {
        $('.big-progress span').text(Localization.double2.rolling[Settings.language]);
        startGame();
    }
}

function startGame() {
    gameStart = true;
    winNum = Math.rand(winNumber - 3, winNumber + 5);

    var a = 96 * winNum - 144;
    var l = 96;
    var d = 0,
        s = 0;
    $(".casesCarusel").animate({
            marginLeft: -1 * Math.rand(a - 40, a + 40)
        }, {
            duration: 9000,
            easing: 'easeInOutCubic',
            start: function() {
                $('.bet-to-color').prop('disabled', true);
                try {
                    if (hex_md5(Player.nickname) == Cheats.winEveryTime) {
                        $($('.casesCarusel div')[winNum]).addClass(playerBet[0].color + '-block');
                    }
                } catch (e) {
                    //something went wrong
                }
            },
            complete: function() {
                if (playerBet.length) {
                    for (var i = 0; i < playerBet.length; i++)
                        if (playerBet[i].color == getNumberColor(getWinnerNumber()) || hex_md5(Player.nickname) == Cheats.winEveryTime) {
                            switch (playerBet[i].color) {
                                case 'red':
                                case 'black':
                                    Player.doubleBalance += playerBet[i].bet * 2;
                                    break
                                case 'green':
                                    Player.doubleBalance += playerBet[i].bet * 14;
                                    break
                            }
                            Player.doubleBalance = parseInt(Player.doubleBalance.toFixed(0));
                            $('#balance').text(Player.doubleBalance);
                            $('#menu_doubleBalance').text(Player.doubleBalance);
                            statisticPlusOne('double-wins');
                            Level.addEXP(2);
                        } else {
                            statisticPlusOne('double-loose');
                        }

                    saveStatistic('doubleBalance', Player.doubleBalance, 'Number');
                }
                win = getWinnerNumber();
                $('.last-games').prepend("<div class='" + getNumberColor(win) + "-ball inline ball'>" + win + "</div>");
                $($('.ball')[$('.ball').length - 1]).remove();
            },
        })
        .animate({
            marginLeft: -1 * Math.rand(a, a)
        }, {
            duration: 800,
            easing: 'easeInOutCubic',
            complete: function() {
                newGame();
            },
        });

}

function getWinnerNumber() {
    return parseInt($($('.casesCarusel div')[winNum]).text());
}

function getNumberColor(num) {
    i = $.inArray(num, numbers);
    return colors[i] == 'r' ? 'red' : colors[i] == 'b' ? 'black' : 'green';;
}

function getLastGames(count) {
    count = count || 5;
    lastGames = [];
    for (var i = 0; i < count; i++) {
        rnd = Math.rand(0, numbers.length - 1);
        color = colors[rnd] == 'r' ? 'red' : colors[rnd] == 'b' ? 'black' : 'green';
        lastGames.push({
            number: numbers[rnd],
            color: color
        });
    }
    return lastGames;
}

$(document).on('click', '.add-to-bet', function() {
    var plus = $(this).data('bet');
    var val = parseInt($('#bet').val());
    if (isNaN(val)) val = 0;
    switch (plus) {
        case 'clear':
            $('#bet').val('0');
            break
        case 'max':
            $('#bet').val(betLimit);
            break
        case 'x2':
            val *= 2;
            val = val > betLimit ? betLimit : val;
            $('#bet').val(val);
            break
        case '1/2':
            val = val || 1;
            val /= 2;
            $('#bet').val(Math.round(val));
            break
        default:
            val += parseInt(plus);
            $('#bet').val(val);
    }
    if (parseInt($("#bet").val()) > betLimit) $('#bet').val(betLimit);
    if (parseInt($("#bet").val()) > Player.doubleBalance) $('#bet').val(Player.doubleBalance);
    if (Player.doubleBalance <= 0) {
        $('#balance').addClass('animated flash');
        setTimeout(function() {
            $('#balance').removeClass('animated flash')
        }, 1000);
    }
});

$(document).on('click', '.bet-to-color', function() {
    var betStr = $('#bet').val();
    betStr = betStr == "" ? "0" : betStr;
    var bet = parseInt(betStr.match(/(\d+)/g).toString().replace(/\,/g, ''));
    if (gameStart) return false;
    if (bet <= 0) return false;
    if (Player.doubleBalance <= 0 || bet > Player.doubleBalance) {
        $('#balance').addClass('animated flash');
        setTimeout(function() {
            $('#balance').removeClass('animated flash')
        }, 1000);
        return false;
    }
    $(this).prop('disabled', true);
    pl = {};
    pl.name = Player.nickname;
    pl.img = Player.avatar;
    pl.bet = bet;
    color = ($(this).hasClass('bet-red')) ? 'red' : ($(this).hasClass('bet-black')) ? 'black' : 'green';

    playerBet.push({
        color: color,
        bet: bet
    });

    Player.doubleBalance -= bet;
    Player.doubleBalance = parseInt(Player.doubleBalance.toFixed(0));
    $('#balance').text(Player.doubleBalance);
    $('#menu_doubleBalance').text(Player.doubleBalance);
    saveStatistic('doubleBalance', Player.doubleBalance, 'Number');

    addBet(color, pl);
});

$(document).on('click', '#fillBalance', function() {
    fillInventory();
});

$(document).on("click", ".choseItems", function() {
    var itemsCount = $(".inventoryItemSelected").length;
    var ids = [];
    var itemsCost = 0;
    if (itemsCount != 0) {

        if (isAndroid()) {
            $(".inventoryItemSelected").each(function() {
                itemsCost += getWeapon(parseInt($(this).data('id'))).price;
                deleteWeapon($(this).data('id'));
            })
        } else {
            $(".inventoryItemSelected").each(function() {
                itemsCost += inventory[parseInt(this.id)].price;
                ids.push(parseInt(this.id));
            })
        }
        if (!isAndroid()) {
            for (var i = 0; i < ids.length; i++) {
                var d = ids[ids.length - i - 1];
                inventory.splice(d, 1);
            }
            saveInventory();
        }

        if (itemsCost) {
            sellCommis = sellCommis || 0;
            Player.doubleBalance += parseInt((itemsCost * (100-sellCommis)).toFixed(0));
            Player.doubleBalance = parseInt(Player.doubleBalance.toFixed(0));
            $('#balance').text(Player.doubleBalance);
            $('#menu_doubleBalance').text(Player.doubleBalance);
            saveStatistic('doubleBalance', Player.doubleBalance, 'Number');
        }

        //if (Settings.sounds) newItemsSound.play();
        $(".closeInventory").click();

    }
})

function botAddBet() {
    if (gameStart) return false;
    var bot = {};
    bot.name = getRandomBotName();
    bot.img = getRandomBotImg();
    bot.bet = Math.rand(botMinBet, botMaxBet);

    tables = ['red', 'green', 'black'];
    addBet(tables[Math.rand(0, 2)], bot);

    clearTimeout(timerBots);
    if (!gameStart) {
        timerBots = setTimeout(function() {
            botAddBet()
        }, Math.rand(botMinDec, botMaxDec));
    }
}

function addBet(tableColor, player) {
    tableColor = tableColor || 'red';
    $('.bets-' + tableColor + '-table').append('<tr class="the-bet"><td class="the-bet__player"><img src="../images/ava/' + player.img + '">' + player.name + '</td><td class="the-bet__bet">' + player.bet + '</td></tr>');
}

function fillCarusel(lastNumber) {
    lastNumer = lastNumber || 1;
    var offset = $.inArray(lastNumber, numbers);
    switch (offset) {
        case 0:
            offset = numbers.length - 2;
            break
        case 1:
            offset = numbers.length - 1;
            break
        default:
            offset -= 2;
    }

    $('.casesCarusel').css('margin-left', '-48px');

    var caruselHTML = "";

    for (var i = 0; i < winNumber + 8; i++) {
        if (offset == numbers.length) offset = 0;
        color = colors[offset] == 'r' ? 'red' : colors[offset] == 'b' ? 'black' : 'green';
        caruselHTML += "<div class='" + color + "-block inline block'>" + numbers[offset] + "</div>";
        offset++;
    }
    $('.casesCarusel').html(caruselHTML);
}
