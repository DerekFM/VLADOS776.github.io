var buySound=new Audio();buySound.src="../sound/buy.wav";buySound.playbackRate=1;buySound.volume=0.4;$(function(){});$(document).ready(function(){$(".navigationBar").append('<sup class="beta"> beta</sup><span id="playerBalance">'+Player.doubleBalance+' <i class="double-icon"></i></span>');var c=[];for(var b=0;b<cases.length;b++){for(var e=0;e<cases[b].weapons.length;e++){var d=cases[b].weapons[e].type;var a=getSkinName(cases[b].weapons[e].skinName,Settings.language);d=Settings.language=="RUS"?d.replace(/Souvenir/g,"Сувенир"):d.replace(/Сувенир/g,"Souvenir");if($.inArray(d+" | "+a,c)==-1){c.push(d+" | "+a)}}}$("#search_text").autocomplete({source:c})});$(document).on("click",".item",function(){var c=$(this).data("name");var d=$(this).data("type");var a=$(this).data("img");var e=$($(this).children(".item__price")[0]).text();var g=$(this).data("stattrak");var f=$(this).data("quality");if(e=="0$"||e=="$0"){$(this).addClass("animated flipOutX");setTimeout($.proxy(function(){$(this).remove()},this),800);return false}var b=g==true?"StatTrak™ ":"";$("#weaponInfoContainer").data("name",c);$("#weaponInfoContainer").data("type",d);$("#weaponInfoContainer").data("stattrak",g);$("#weaponInfoContainer").data("img",a);$("#weaponInfoContainer").data("price",e.replace(/\$/,""));$("#weaponInfoContainer").css("display","block");$("#weaponImg").attr("src",getImgUrl(a,1));$("#weaponName").html(b+d+" | "+getSkinName(c,Settings.language));$("#weaponPrice").html(e);$("#weaponQuality").html(f);if(typeof e=="string"){if(isNaN(parseFloat(e))){e=parseFloat(e.substr(1))}}$("#buy-double").html((parseFloat(e)*100).toFixed(0)+' <i class="double-icon"></i>')});$(document).on("click","#buy-double",function(){var b=getWeaponRarity($("#weaponInfoContainer").data("type"),$("#weaponInfoContainer").data("name"));var a={type:$("#weaponInfoContainer").data("type"),skinName:$("#weaponInfoContainer").data("name"),img:$("#weaponInfoContainer").data("img"),quality:$("#weaponQuality").text(),statTrak:$("#weaponInfoContainer").data("stattrak"),rarity:b,price:parseFloat($("#weaponInfoContainer").data("price").replace(/\$/,"")),"new":true};if(Player.doubleBalance<a.price*100){$("#weaponPrice").addClass("animated flash");setTimeout(function(){$("#weaponPrice").removeClass("animated flash")},1000);return false}if(isAndroid()){saveWeapon(a)}else{inventory.push(a);saveInventory()}if(Settings.sounds){buySound.play()}Player.doubleBalance-=parseInt((a.price*100).toFixed(0));saveStatistic("doubleBalance",Player.doubleBalance);$("#playerBalance").html(Player.doubleBalance+' <i class="double-icon"></i>');$("#buy-double").prop("disabled",true);$(".buy-animation").addClass("buy-animation-show",500,hideBuyCheck);checkInventoryForNotification()});function hideBuyCheck(){$(".buy-animation").addClass("animated zoomOut");setTimeout(function(){$(".buy-animation").removeClass("buy-animation-show");$(".buy-animation").removeClass("animated");$(".buy-animation").removeClass("zoomOut");$("#buy-double").prop("disabled",false)},800)}$(document).on("click","#search_button",function(){if($("#search_text").val()!=""){}search($("#search_text").val())});function search(b){var c=[];if(b.indexOf(" | ")!=-1){var h=b.split(" | ");c=getAllWeaponInfo(h[0],h[1],true)}else{if($(".ui-menu-item").length!=0){var f=$(".ui-menu-item").length;for(var e=0;e<f;e++){var j=$($(".ui-menu-item")[e]).text();var h=j.split(" | ");c=c.concat(getAllWeaponInfo(h[0],h[1]))}}}var g="";for(var e=0;e<c.length;e++){var k=c[e].statTrak==true?"StatTrak™ ":"";var a="regular";a=c[e].statTrak==true?"statTrak":a;a=c[e].type.indexOf("★")!=-1?"knive":a;a=c[e].type.match(/(?:Сувенир|Souvenir)/)!=null?"souvenir":a;var d="data-type='"+c[e].type+"' data-name='"+c[e].skinName+"' data-quality='"+c[e].quality+"' data-statTrak='"+c[e].statTrak+"' data-price='"+c[e].price+"' data-img='"+c[e].img+"'";g+="<tr class='item' "+d+"><td><img src='"+getImgUrl(c[e].img)+"' class='"+a+"_border'></td><td class='item__name-group "+a+"_color'><span class='item__type'>"+k+c[e].type+"</span> | <span class='item__name'>"+c[e].skinName+"</span> (<span class='item__quality'>"+c[e].quality+"</span>)</td><td class='item__price' data-price-for='"+k+c[e].type+" | "+c[e].skinName+" ("+c[e].quality+")'>$"+c[e].price+"</td></tr>"}$("#search_result").html(g)}$(document).on("click",".glassBlur",function(){$("#weaponInfoContainer").css("display","none")});function getAllWeaponInfo(m,b,n){n=n||false;var c=[];var f=false,d=false,j=2;if(m.match(/(?:Сувенир|Souvenir)/)){d=true;j=1}else{var l=getCollection(m,getSkinName(b));j=l.type=="Collection"?1:j}var h=getWeaponImg(m,b);for(var k=0;k<j;k++){for(var g=0;g<Quality.length;g++){var o=Settings.language=="RUS"?Quality[g].name[1]:Quality[g].name[0];var a=getPriceIfExists(m,b,o,f);if(!a){var e='[data-price-for="'+(f==true?"StatTrak™ ":"")+m+" | "+b+" ("+o+')"]';getMarketPrice(m,b,o,f,e,false)}if(a||n){c.push({type:m,skinName:b,quality:o,statTrak:f,price:a,img:h})}}if(!d){f=true}}return c};