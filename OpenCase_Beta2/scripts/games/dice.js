var Dice = {
    betLimit: 500000,
    odometer: null,
    init: function() {
        $(function() {
            
            $('#balance').text(Player.doubleBalance);
            
            $(document).on('click', '#start_roll', Dice.startGame);
            
            $('#bet').on('keyup', function() {
                var betText = $('#bet').val();
                if (betText.match(/\D+/)) {
                    $('#bet').val($('#bet').val().replace(/\D+/, ''));
                }
                if (parseInt(betText) > Player.doubleBalance)
                    $('#bet').val(Player.doubleBalance);
                if (parseInt(betText) > Dice.betLimit)
                    $('#bet').val(Dice.betLimit);
            })

            $(document).on('click', '#oddsOverUnder', function() {
                var text = $(this).text();
                var winRoll = parseInt(text.replace(/(<|>)/, ''));
                var symb = text[0] == '<' ? '>' : '<';

                winRoll = 9999 - winRoll;
                $(this).text(symb + ' ' + winRoll);
            })
            
            $(document).on('click', 'button[data-bet]', function() {
                var plus = $(this).data('bet');
                var val = parseInt($('#bet').val());
                if (isNaN(val)) val = 0;
                switch (plus) {
                    case 'clear':
                        $('#bet').val('0');
                        break
                    case 'max':
                        $('#bet').val(Dice.betLimit);
                        break
                    case 'x2':
                        val *= 2;
                        val = val > Dice.betLimit ? Dice.betLimit : val;
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
                if (parseInt($("#bet").val()) > Dice.betLimit) $('#bet').val(Dice.betLimit);
                if (parseInt($("#bet").val()) > Player.doubleBalance) $('#bet').val(Player.doubleBalance);
                if (Player.doubleBalance <= 0) {
                    $('#balance').addClass('animated flash');
                    setTimeout(function() {
                        $('#balance').removeClass('animated flash')
                    }, 1000);
                }
            });

            $(document).on('click', '#oddsPayout, #oddsWinChance', function() {
                if ($(this).hasClass('opened')) return;
                if ($('.opened').length > 0) $('.opened span.btn-success').click();
                
                $(this).addClass('opened');

                var currVal = parseFloat($(this).text());

                var html = '<input type="text" class="form-control" pattern="[0-9.]*" value="' + currVal.toFixed(2) + '"> \
                            <span class="glyphicon glyphicon-ok btn btn-sm btn-success"></span>';
                $(this).html(html);

                $(document).one('click', '#oddsPayout span.btn-success, #oddsWinChance span.btn-success', function(e) {
                    e.stopPropagation();
                    var $parent = $(this).parent();
                    var value = parseFloat($($parent).children('input').val());
                    $($parent).removeClass('opened');                  
                    var config = {};
                    
                    if ($($parent).attr('id') == 'oddsPayout') {
                        value = checkPayout(value);
                        config.payout = value;
                    } else {
                        value = checkChance(value);
                        config.winChance = value;
                    }
                    Dice.recount(config);
                })
                
                $(this).children('input').on('keyup', function(event) {
                    if ($(this).parent().attr('id') == 'oddsPayout') {
                        var payout = checkPayout(parseFloat($(this).val()));
                        var chances = calcChances(payout)
                        var winRoll = calcWinRoll(chances);
                        
                        $('#oddsOverUnder').text(winRoll);
                        $('#oddsWinChance').text(chances.toFixed(2)+'%');
                    } else {
                        var chances = checkChance(parseFloat($(this).val()));
                        var payout = 97.5 / chances;
                        var winRoll = calcWinRoll(chances);
                        
                        $('#oddsOverUnder').text(winRoll);
                        $('#oddsPayout').text(payout.toFixed(2)+'x');
                    }
                })
                
                function calcWinRoll(chances) {
                    return $('#oddsOverUnder').text()[0] == '>' ? '> '+ parseInt(1E4 - (100 * chances + 1)) : '< ' + parseInt(100 * chances);
                }
                function calcChances(payout) {
                    return (100 / payout - 100 / payout * 0.025);
                }
                
                function checkChance(value) {
                    return isNaN(value) ? 0.01 : value > 70 ? 70 : value < 0.01 ? 0.01 : value;
                }
                function checkPayout(value) {
                    return isNaN(value) ? 1.4 : value > 9750 ? 9750 : value < 1.4 ? 1.4 : value;
                }
            })
        })
        
        firebase.auth().onAuthStateChanged(function (user) {
        // Once authenticated, instantiate Firechat with the logged in user
            if (user != null) {
                firebase.database().ref('users/'+user.uid+'/moder/group').once('value')
                .then(function(snapshot) {
                    var group = snapshot.val();
                    if (!group) {
                        return
                    } else if (group.match(/vip/)) {
                        Dice.betLimit = 100000;
                    }
                })
            }
        })
    },
    recount: function(config) {
        if (config.payout) {
            var payout = config.payout;
            var chances = (100 / config.payout - 100 / config.payout * 0.025);
        } else if (config.winChance) {
            var chances = config.winChance;
            var payout = 97.5 / chances;
        }
        var winRoll = $('#oddsOverUnder').text()[0] == '>' ? '> '+ parseInt(1E4 - (100 * chances + 1)) : '< ' + parseInt(100 * chances);
        $('#oddsOverUnder').text(winRoll);
        $('#oddsPayout').text(payout.toFixed(2)+'x');
        $('#oddsWinChance').text(chances.toFixed(2)+'%');
    },
    startGame: function(counter) {
        counter = typeof counter == 'number' ? counter : 0;
        var bet = parseInt($('#bet').val());
        if (isNaN(bet) || bet < 0 || bet > Player.doubleBalance || bet > Dice.betLimit) return false;
        
        if ($('#oddsPayout .btn-success').is(':visible'))
            $('#oddsPayout .btn-success').click();
        if ($('#oddsWinChance .btn-success').is(':visible'))
            $('#oddsWinChance .btn-success').click();
        
        var number = Math.rand(0, 9999);
        
        var condition = $('#oddsOverUnder').text();
        var playerWin = condition[0] == '>' ? number > parseInt(condition.replace('>', '')) : number < parseInt(condition.replace('<', ''));

        if (playerWin && Math.rand(0, 100) > 40 && counter < 4) {
            Dice.startGame(++counter);
            return;
        }
        
        $('#start_roll').html('<span class="odometer time-2000"></span>');
        
        Dice.odometer = new Odometer({el: $('.odometer')[0], value: 0, duration: 2000, format: 'ddddd'})
        Dice.odometer.render();
        
        $('.odometer').html(number);
        
        $('#start_roll').prop('disabled', true);
        
        setTimeout(function() {
            $('#start_roll').html(Localization.getString('dice.game.end_roll', 'Rolled ${1}. Roll again?').replace('${1}', number));

            var profit = 0;
            if (playerWin) {
                profit = parseInt(bet * parseFloat($('#oddsPayout').text())) - bet;
                Player.doubleBalance += profit;
                
                Level.addEXP(2);
            } else {
                profit = bet;
                Player.doubleBalance -= bet;
                profit *= -1;
            }
            saveStatistic('doubleBalance', Player.doubleBalance);
            $('#balance').text(Player.doubleBalance);
            $('#menu_doubleBalance').text(Player.doubleBalance);

            $('#start_roll').prop('disabled', false);
            $('#start_roll').removeAttr('disabled');
            Dice.historyPush({
                bet: bet,
                payout: parseFloat($('#oddsPayout').text()),
                condition: condition,
                random: number,
                profit: profit,
            });
            LOG.log({
                game: 'Dice',
                action: 'End game',
                bet: bet,
                payout: parseFloat($('#oddsPayout').text()),
                condition: condition,
                random: number,
                profit: profit,
                playerWin: playerWin
            })
        }, 2000);
    },
    historyPush: function(item) {
        var row = '<tr class="' + (item.profit > 0 ? 'success' : 'danger') + '"> \
            <td>' + item.bet + '</td><td>' + item.payout + '</td><td>' + item.condition + '</td><td>' + item.random + '</td><td>' + item.profit +'</td></tr>';
        $('#my_history tbody').prepend(row);
        
        if ($('#my_history tbody tr').length > 10) {
            $('#my_history tbody tr:last-child').remove();
        }
    }
}
