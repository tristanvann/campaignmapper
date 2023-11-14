$(function() {
    
    //VARS
    const hexSrc = 'hex_gray.png',
		  playerIcon = 'player_icon2.png',
		  adminPrefix = (admin) ? '../' : '',
          hexOffsetX = -19,
          hexOffsetY = -29,
		  months = ['Midwinter (Jan)','Firstbloom (Feb)','Greenboughs (Mar)','Plantings (Apr)','Harrowing (May)','Haygather (Jun)','Midsummer (Jul)','Firstharvest (Aug)','Winnowing (Sep)','Sowings (Oct)','Redleaves (Nov)','Chillwind (Dec)'];
    let mapCurrentSrc = '',
        mapSize = {h: 0, w: 0},
        hexSize = {h: 0, w: 0},
        hexCoords = [],
		names = {},
		mapData = {
			'currentMap': '',
			'top': 0,
			'left': 0,
			'playerHex': 0,
			'day': 0, //UNIX_TIMESTAMP
			'region': '' //'arctic','cold','temperate','warm','desert','tropical'
		},
		mapDB = {},
		revealed = [],
        changeMap = {bottom: '', left: '', right: '', top: ''},
        loadImgs = 0, //increment after map load and hex load
		autoEnc = true; //whether encounters should be rolled automatically when the party moves
    	
    //GET MAP DIMENSIONS & RENDER MAP
	function renderMap(mapSrc, initial) {
		//console.log('renderMap()');
		let imgpath = new Image();
		imgpath.src = adminPrefix+'img/'+mapSrc;
		imgpath.onload = function(){
			//console.log(this.width, this.height);
			mapSize.h = this.height;
			mapSize.w = this.width;
			$('#map img').remove();
			$('.hex').remove();
			document.getElementById('map').appendChild(imgpath);
			$('.hexes').attr('style','width:'+this.width+'px;height:'+this.height+'px')
			loadImgs++;
			if (loadImgs >= 2) {
				calcGrid(mapSize, hexSize, hexOffsetX, hexOffsetY, initial);
			}
		};
	}
    
    //GET HEX DIMENSIONS
    let hexpath = new Image();
    hexpath.src = adminPrefix+'img/'+hexSrc;
    hexpath.onload = function(){
        //console.log(this.width, this.height);
        hexSize.h = this.height;
        hexSize.w = this.width;
        loadImgs++;
        if (loadImgs == 2) {
            calcGrid(mapSize, hexSize, hexOffsetX, hexOffsetY, true);
        }
    };
	
	//RELOAD BUTTON
	$('.reloader').click(function() {
		getMapData(false);
	});
	
	//SHOW/HIDE GRID
	$('.gridToggle span').click(function() {
		$('body').toggleClass('hideGrid');
	});
    
    //FUNCTIONS
    function calcGrid(mapSize, hexSize, hexOffsetX, hexOffsetY, initial) {
		//console.log('calcGrid()');
        //get units across/down
        let across = Math.ceil((mapSize.w / (hexSize.w * 0.75))+1),
            down = Math.ceil((mapSize.h / hexSize.h)+1),
            iCount = 0;
        //create coord array
        let countDown = hexOffsetY;
        //loop down
        for (d = 0; d < down; d++) {
            let countAcross = hexOffsetX, //across has to reset on each down loop
                bump = false; //evens get bumped down
            //loop across
            for (a = 0; a < across; a++) {
                let coord = (bump) ? [countAcross, countDown + (hexSize.h * 0.5)] : [countAcross, countDown];
                hexCoords.push(coord);
                renderHex(coord[0], coord[1], iCount, d, a, bump);
                iCount++; //keeps track of the array index, for element ID
                bump = !bump;
                countAcross += (hexSize.w * 0.75);
            }
            countDown += hexSize.h;
        }
        //console.log(hexCoords);
		initReveal(revealed, initial);
    };
	function getMapData(initial) {
		//console.log('getMapData()');
		$.get(adminPrefix+"db/mapData.json", function(data) {
			//console.log(data);
			let changed = (JSON.stringify(mapData) != JSON.stringify(data));
			if (changed) mapData = data;
			loadMapData(data.currentMap, changed, initial);
			if (admin) $('.region select').val(mapData.region);
		});
	};
	function loadMapData(currentMap, changed, initial) {
		//console.log('loadMapData()');
		$.get(adminPrefix+"db/mapDB.json", function(data) {
			//console.log(data);
			changed = (JSON.stringify(data[currentMap].revealed) != JSON.stringify(revealed)) ? true : changed;
			if (changed) {
				let newSrc = data[currentMap].img;
				mapDB = data;
				revealed = data[currentMap].revealed;
				//console.log(newSrc);
				//console.log(mapCurrentSrc);
				if (newSrc != mapCurrentSrc) {
					mapCurrentSrc = newSrc;
                    $('.showArrow').removeClass('showArrow');
                    let arrowArray = ['top','bottom','left','right'];
                    for(let i=0; i<arrowArray.length; i++) {
                        if (data[currentMap][arrowArray[i]]) {
                            $('.'+arrowArray[i]+'.arrow').addClass('showArrow');
                            changeMap[arrowArray[i]] = data[currentMap][arrowArray[i]];
                        } else {
                            changeMap[arrowArray[i]] = '';
                        }
                    }
					loadImgs = 1;
                    renderMap(newSrc, initial);
				} else {
					initReveal(revealed, initial);
				}
			}
			if (!admin) { //constantly check for updates
				setTimeout(function(){
                    console.log('checking');
					getMapData(false);
				}, 1000);
			}
		});
	};
    function renderHex(x, y, i, row, col, bump) {
        let bumped = (bump) ? ' bumped' : '';
        $('<div class="hex'+bumped+'" id="hex'+i+'" style="left:'+x+'px;top:'+y+'px" data-colrow="c'+col+'r'+row+'"><img src="'+adminPrefix+'img/'+hexSrc+'"></div>').appendTo('.hexes');
    };
    function revealHex(i, showHide) {
        let iOf = revealed.indexOf(i);
        if (iOf == -1 && showHide != 'hide') {
            revealed.push(i);
            $('#hex'+i).addClass('revealed');
        } else if (iOf > -1 && showHide != 'show') {
            revealed.splice(iOf,1);
            $('#hex'+i).removeClass('revealed');
        }
        //console.log(mapData.revealed);
    };
    function initReveal(arr, initial) {
		console.log('initReveal()');
		setDay();
		if (!initial) {
			$('.hex').removeClass('revealed');
		}
        for (i=0;i<arr.length;i++) {
            $('#hex'+arr[i]).addClass('revealed');
			revealed[i] = parseInt(revealed[i]); //convert to int
        }
		setTimeout(function(){ $('.mapper').addClass('loaded'); }, 1000);
		if (initial) {
			$(window).scrollTop(mapData.top);
			$(window).scrollLeft(mapData.left);
			$('.mapper').append('<div class="party"><img src="'+adminPrefix+'img/'+playerIcon+'"></div>');
		}
		getWeather();
		placeMarker(initial);
    };
	function placeMarker(initial) {
		let x = $('#hex'+mapData.playerHex).position().top,
			y = $('#hex'+mapData.playerHex).position().left;
		$('.party').css({'top':x+'px','left':y+'px'});
		if (admin && autoEnc && !initial) encounterCheck();
	};
	function setDay() {
		let date = new Date(mapData.day*1000),
			month = months[date.getMonth()],
			day = date.getDate(),
			year = date.getFullYear() - 800;
		$('.topbar .day').html(day+' '+month+', '+year);
	};
	function changeDay(rev) {
		let newDay = (rev) ? mapData.day-86400 : mapData.day+86400;
		mapData.day = newDay;
		setDay();
		getWeather();
		save(false);
	};
	function encounterCheck() {
		let chance = parseInt($('.encounter select').val()),
			d100 = Math.floor(Math.random() * 100) + 1,
			result = (d100 <= chance) ? '<i class="icon-warning"></i>' : '<i class="icon-clear"></i>',
			CR = (d100 <= chance) ? 'CR: <span>'+Math.min(encounterLevel(), encounterLevel())+'</span>' : '';
		$('.enc.icon').html(result);
		$('.cr').html(CR);
	};
	function encounterLevel() {
		let rand = Math.floor(Math.random() * 624) + 1, //get random # between 1 and 624 (24^2 = 625)
			encCR = 25 - Math.floor(Math.sqrt(rand));
		return encCR;
	};
	function getWeather() {
		let coords = latlng[mapData.region];
		$.ajax({
			url: 'https://'+'api.darksky.net/forecast/a61f2561aba84c5cf1a729f103b82f1a/'+coords+','+mapData.day+'?exclude=currently,minutely,hourly,alerts,flags',
			//url: adminPrefix+'js/weatherSample.json',
			type: "GET",
			crossDomain: true,
			dataType: "jsonp", //jsonp for darksky, json for local test
			success: function(response) {
				console.log(response);
				let tempHi = Math.round(response.daily.data[0].apparentTemperatureMax),
					tempLo = Math.round(response.daily.data[0].apparentTemperatureMin),
					icon = response.daily.data[0].icon,
					summary = response.daily.data[0].summary,
					wind = Math.round(response.daily.data[0].windSpeed),
					moon = response.daily.data[0].moonPhase;
				if (moon >= 0 && moon < 0.125) moon = 'moon-full'; //new moon
				if (moon >= 0.125 && moon < 0.25) moon = 'moon-waning-gibbous'; //waxing crescent
				if (moon >= 0.25 && moon < 0.375) moon = 'moon-last-quarter'; //first quarter
				if (moon >= 0.25 && moon < 0.5) moon = 'moon-waning-crescent'; //waxing gibbous
				if (moon >= 0.5 && moon < 0.625) moon = 'moon-new'; //full moon
				if (moon >= 0.625 && moon < 0.75) moon = 'moon-waxing-crescent'; //waning gibbous
				if (moon >= 0.75 && moon < 0.875) moon = 'moon-first-quarter'; //last quarter
				if (moon >= 0.875 && moon <= 1) moon = 'moon-waxing-gibbous'; //waning crescent
				$('.weather .temp').html(tempHi+'&deg;/'+tempLo+'&deg;');
				$('.weather .icon').html('<i class="icon-'+icon+'">');
				$('.weather .summary').html(summary);
				$('.weather .wind span').html(wind+' mph');
				$('.topbar .moon .icon').html('<i class="icon-'+moon+'">');
			},
			error: function(xhr, status) {
				console.log(xhr);
				console.log(status);
			}
		});
	};
	
	//ON LOAD
	getMapData(true);
	
	//FOR ADMIN
	if (admin) {
	
		//SAVE
		var saveTimer;
		function save(changeMap) {
			window.clearTimeout(saveTimer);
			saveTimer = window.setTimeout(function() {
				console.log('saving!');
				if (!changeMap) mapDB[mapData.currentMap].revealed = revealed;
				$('.mapper').addClass('saving');
				var send = {
					mapJSON: JSON.stringify(mapData),
					mapDB: JSON.stringify(mapDB)
				};
				console.log(send);
				$.post(adminPrefix+'php/saveMap.php', send, function(data) {
					console.log(data);
					$('.mapper').removeClass('saving');
				});
			},1);
		};
		
		//GET NAME LISTS
		$.get(adminPrefix+"php/getNames.php", function(data) {
			let opts = [];
			names = JSON.parse(data)
			for (var option in names) {
				if (names.hasOwnProperty(option)) {
					opts.push(option);
				}
			}
			opts.sort();
			for (var i=0; i<opts.length; i++) {
				let optVal = opts[i].replace(/ /g,"-").toLowerCase();
				$('.namegen select').append('<option val="'+optVal+'">'+opts[i]+'</option>');
			}
		});
		
		//CHANGE REGION (FOR WEATHER)
		$('.region select').change(function() {
			let newRegion = $(this).val();
			console.log(newRegion);
			mapData.region = newRegion;
			getWeather();
			save(false);
		});
		
		//RANDOM NAME GEN
		$('.namegen').on('click', '.button', function() {
			let val = $('.namegen select').val(),
				indexFirst = Math.floor(Math.random()*names[val]['First'].length),
				indexLast = Math.floor(Math.random()*names[val]['Last'].length),
				randomFirst = names[val]['First'][indexFirst],
				randomLast = names[val]['Last'][indexLast];
			$('.name-area').html(randomFirst+' '+randomLast);
		});
		
		//DAY ADVANCE/ROLLBACK
		$('.topbar').on('click', '.arrow', function() {
			let rev = $(this).hasClass('prev');
			changeDay(rev);
		});
		
		//RANDOM ENCOUNTER CHECK
		$('.encounter').on('click', '.button', function() {
			console.log('encounter check!');
			encounterCheck();
		});
		
		//AUTO ENCOUNTER CHECKBOX
		$('.encounter .auto input').change(function() {
			autoEnc = !autoEnc;
			$('body').toggleClass('autoEnc');
		});
		
        //CHANGE MAP W/ ARROWS
        $('.arrows .arrow').click(function() {
            let direction = $(this).hasClass('top') ? 'top' : 
                ($(this).hasClass('bottom') ? 'bottom' : 
                    ($(this).hasClass('left') ? 'left' :
                        ($(this).hasClass('right') ? 'right' : '')
                    )
                );
            if (changeMap[direction]) {
                mapData.currentMap = changeMap[direction];
                loadMapData(mapData.currentMap, true, false);
                save(true);
            }
        });
        
		//MAP REVEAL/MOVE PARTY ICON
		$('.hexes').on('click', '.hex', function(e) {
			if (e.shiftKey) {
				//SHOW/HIDE GROUP OF HEX UNITS
				const colrow = $(this).attr('data-colrow'),
					  x = parseInt(colrow.split('r')[0].substring(1)),
					  y = parseInt(colrow.split('r')[1]),
					  bumped = $('.hex[data-colrow="c'+x+'r'+y+'"]').hasClass('bumped'),
					  showHide = ($('.hex[data-colrow="c'+x+'r'+y+'"]').hasClass('revealed')) ? 'hide' : 'show';
				let matrix = [];
				if (bumped) {
					matrix = [
						[x,y-1],
						[x-1,y],[x,y],[x+1,y],
						[x-1,y+1],[x,y+1],[x+1,y+1]
					];
				} else {
					matrix = [
						[x-1,y-1],[x,y-1],[x+1,y-1],
						[x-1,y],[x,y],[x+1,y],
						[x,y+1]
					];
				}
				for(n=0;n<matrix.length;n++) {
					let targetSel = '.hex[data-colrow="c'+matrix[n][0]+'r'+matrix[n][1]+'"]',
						i = $(targetSel).attr('id');
					i = parseInt(i.replace(/\D/g,'')); //remove 'hex'
					revealHex(i, showHide);
				}
			} else if (e.ctrlKey) {
				//MOVE PLAYER ICON
				let hex = $(this).attr('id');
				hex = parseInt(hex.replace('hex',''));
				mapData.playerHex = hex;
				placeMarker();
			} else {
				//SHOW/HIDE HEX UNIT
				let i = $(this).attr('id');
				i = parseInt(i.replace(/\D/g,'')); //remove 'hex'
				revealHex(i);
			}
			save(false);
		});
    }
	
});