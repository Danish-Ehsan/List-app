$(function() {

	var $addBtn = $('#add-button');
	var $delBtn = $('#delete-button');
	var $backBtn = $('#back-button');
	var $mainCont = $('#main-list-container');
	var $indvlCont = $('#individual-list-container');
	var $indvlList = $('#individual-list');
	var $listTitle = $('#list-title');
	var $messageCont = $('#message-container');
	var $scrollIcon = $('#scroll-icon');
	//using JS object because $JQ object doesn't seem to update reference with new elements
	var allListItems = document.getElementsByClassName('list-item');
	var $settingsIcon = $('#settings');
	var $settingsMenu = $('#settings-menu');
	
	var mainListArray = [];
	var shift = false;
	var currentIndex;
	var deleting = false;
	var lastDeleted;
	var undoTimer;


	console.log(localStorage.mainListArray);

	//localStorage.clear();

	//load locally stored lists if available
	if (localStorage.mainListArray) {
		mainListArray = JSON.parse(localStorage.mainListArray);
		loadMainList();
	}

	$addBtn.on('click', function() {
		deleting = false;
		$messageCont.hide();
		if($indvlCont.css('display') == 'none') {
			$indvlList.empty();

			//currentIndex updates before mainListArray has new push so no need for length -1 to account for 0 base index
			currentIndex = mainListArray.length;
			mainListArray.push({items: [], timestamp: Date.now()});

			if (window.localStorage && !localStorage.mainListArray) {
				localStorage.setItem('mainListArray', JSON.stringify(mainListArray));
			}

			$mainCont.hide();
			$indvlCont.show();
			$delBtn.find('span').text('Delete Item');
			$addBtn.find('span').text('Add Item');

			$listTitle.val('').focus();

			newListItem();
		} else {
			newListItem(true);
		}
	});

	$listTitle.on('keyup', function(e) {
		if (shift && e.which == 9) {
			shift = false;
			return false;
		} 
		updateListArray(e);
	});

	//cancels default TAB behaviour
	$listTitle.on('keydown', function(e) {
		if (e.which == 9) { return false; }
	});

	$indvlList.on('input', function(e) {
			updateListArray(e);
			scrollIconToggle();
	}).on('change', '.checkbox', function(e) {
		crossOff(e);
	});

	$delBtn.on('click', deleteList);

	$backBtn.on('click', function() {
		//delete new list if inputs were blank
		if ($mainCont.css('display') == 'none') { 
			if (!mainListArray[mainListArray.length - 1].name && !mainListArray[mainListArray.length - 1].items.length) {
				mainListArray.splice((mainListArray.length - 1), 1);
				localStorage.mainListArray = JSON.stringify(mainListArray);
			//if title left blank replace with 'unnamed'
			} else if (!mainListArray[mainListArray.length - 1].name && mainListArray[mainListArray.length - 1].items) {
				mainListArray[mainListArray.length -1].name = 'unnamed';
				localStorage.mainListArray = JSON.stringify(mainListArray);
			}
			loadMainList();
		}
	});

	$mainCont.on('click', function(e) {
		loadIndvlList(e);
	});

	$settingsIcon.on('click', '#settings-icon', function() {
		$settingsIcon.toggleClass('active');
		$settingsMenu.toggleClass('active');
	});

	$settingsMenu.on('click', function(e) {
		console.log(e.target);
		$target = $(e.target);
		$target.find('ul').toggle();
		if ($target.parent().is('.innerMenu')) {
			console.log('menu test');
			sortList(e);
		}
	});
/*
	$settingsMenu.on('click', $('li > ul'), function(e) {
		console.log('menu test');
		console.log('menu target= ' + e.target);
	});
*/

	function sortList(e) {
		var $target = $(e.target);
		$settingsIcon.toggleClass('active');
		$settingsMenu.toggleClass('active').find('ul').hide();

		console.log('target text= ' + $target.text());
		if ($mainCont.css('display') == 'block') {
			console.log('sort test 2');
			if ($target.text() == 'by name') {
				console.log('sort test 3');
				mainListArray.sort(function(a, b) {
					if (a.name > b.name) {
						return 1;
					} else if (a.name < b.name) {
						return -1;
					} else {
						return 0;
					}
				});
			} else if ($target.text() == 'by date') {
				mainListArray.sort(function(a, b) {
					if (a.timestamp < b.timestamp) {
						return -1;
					} else if (a.timestamp > b.timestamp) {
						return 1;
					} else {
						return 0;
					}
				});
			}
			loadMainList();
		} else {
			if ($target.text() == 'by name') {
				mainListArray[currentIndex].items.sort(function(a, b) {
					if ((a.content > b.content) && (a.checked == b.checked)) {
						return 1;
					} else if ((a.content < b.content) && (a.checked == b.checked)) {
						return -1;
					} else if ((a.checked == b.checked) || (a.content != b.content)) {
						return 0;
					}
				});
			} else if ($target.text() == 'by date') {
				mainListArray[currentIndex].items.sort(function(a, b) {
					if ((a.timestamp > b.timestamp) && (a.checked == b.checked)) {
						return 1;
					} else if ((a.timestamp < b.timestamp) && (a.checked == b.checked)) {
						return -1;
					} else if ((a.checked == b.checked) || (a.timestamp != b.timestamp)) {
						return 0;
					}
				});
			}
			loadIndvlList();
		}
		localStorage.mainListArray = JSON.stringify(mainListArray);
	}


	function updateListArray(e) {
		var target = e.target;
		var listIndex = $(target).parent().index();
	
		textareaHeight(target);

		if (target.name == 'list-title') {
			//if keypress is ENTER
			if (e.which == 13 || e.which == 9) {
				allListItems[0].focus();
				return false;
			} else {
				mainListArray[currentIndex].name = target.value;
				//localStorage.mainListArray[currentIndex].name = target.value;
				localStorage.mainListArray = JSON.stringify(mainListArray);
				//console.log(localStorage.mainListArray);
			}
		} else {
			if (mainListArray[currentIndex].items) {
				mainListArray[currentIndex].items[listIndex].content = target.value;
				localStorage.mainListArray = JSON.stringify(mainListArray);
			} else {
				debugger;
				mainListArray[currentIndex].items = [target.value];
				localStorage.setItem('mainListArray', JSON.stringify(mainListArray));
				console.log(localStorage.mainListArray);
			}
		}
		console.log(mainListArray);
	}

	function textareaHeight(target) {
		//add row to textarea as required
		if (target.name == 'list-item') {
			//row needs to shrink to 1 each time to shrink the box when text is deleted
			target.rows = 1;
			while (target.scrollHeight > target.offsetHeight) {
				var rows = target.rows;
				target.rows = rows + 1;
			}		
		}
	}

	function newListItem(focus, loading) {
		//new list item should always be on the bottom when called by loadIndvlList() with loading parameter
		var $listItem = $indvlList.find('.crossed-off').length && !loading ? $('<li>').insertBefore($indvlList.find('.crossed-off').parent()) : $('<li>').appendTo($indvlList);
		var $label = $('<label>').appendTo($listItem);
		var $checkbox = $('<input>').appendTo($label).attr({
			type: 'checkbox',
			class: 'checkbox'
		});
		$('<span>').appendTo($label).addClass('custom-checkbox');
		var $input = $('<textarea>').appendTo($listItem).attr({
			rows: '1',
			name: 'list-item',
			class: 'list-input list-item'
		}).css('resize', 'none');

		if (focus) { $input.focus(); };

		console.log('newlistitem index= ' + $listItem.index());
		//create space for newItem so crossed item doesn't get overwritten on input but not when called by loadIndvlList()
		if ($indvlList.find('.crossed-off').length && !loading) {
			mainListArray[currentIndex].items.splice($listItem.index(), 0, {});
		} else if (!loading) {
			mainListArray[currentIndex].items.push({timestamp: Date.now(), index: $listItem.index(), checked: false});
		}

		$listItem.on('keydown', function(e) {
			$target = $(e.target);
			//if key is ENTER or DOWN-ARROW
			if (e.which == 13 || e.which == 40) {
				if ($listItem.index() >= allListItems.length - 1) {
					newListItem(true);
					return false;
				} else {
					allListItems[$listItem.index() + 1].focus();
					return false;
				}
			//if keypress is UP-ARROW
			} else if (e.which == 38) {
				if ($listItem.index() >= 1) { 
					allListItems[$listItem.index() - 1].focus();
				}
			//if keypress is SHIFT
			} else if (e.which == 16) { 
				shift = true;
				console.log('shift= ' + shift);
				$indvlList.on('keyup', function(e) {
					if (e.which == 16) {
						shift = false;
						console.log('shift= ' + shift);
						$indvlList.off('keyup');
					}
				});
			//if keypress is TAB
			} else if (e.which == 9) {
				if (!shift) {
					if ($listItem.index() >= allListItems.length -1) {
						console.log('$listitem index= ' + $listItem.index());
						console.log('allitems length= ' + (allListItems.length - 1));
						newListItem(true);
						return false;
					} else {
						console.log('$listitem index= ' + $listItem.index());
						console.log('allitems length= ' + (allListItems.length - 1));
						console.log(allListItems);
						allListItems[$listItem.index() + 1].focus();
						return false;
					}
				} else {
					if ($listItem.index() >= 1) {
						allListItems[$listItem.index() - 1].focus();
						return false;
					} else {
						$listTitle.focus();
						return false;
					}
				}
			//if key is BACKSPACE
			} else if (e.which == 8 && !$target.val() && allListItems.length > 1) {
				//focus on 'input' from previous 'li'
				console.log('$listItem index= ' + $listItem.index());
				mainListArray[currentIndex].items.splice($listItem.index(), 1);
				$target.parent().prev().children().focus();
				$target.parent().remove();
				console.log(mainListArray);
				//check if scroll icon should be removed
				scrollIconToggle();
				//return false so the previous lists letter doesn't delete after keyup
				return false;
			}
		});
		scrollIconToggle();
	}


	//show scroll icon if list is overflowing
	function scrollIconToggle() {
		var $thisList = $mainCont.css('display') == 'none' ? $indvlList : $mainCont;

		if ($thisList.prop('scrollHeight') > $thisList.height() && $scrollIcon.css('display') == 'none') {
			$scrollIcon.show();
			console.log('scroll arrow show');
		} else if ($thisList.prop('scrollHeight') <= $thisList.height() && $scrollIcon.css('display') == 'block'){
			$scrollIcon.hide();
			console.log('scroll arrow hide');
		}
	}

	function loadMainList() {
		//if ($mainCont.css('display') == 'none') {
			console.log(mainListArray);
			$mainCont.empty();
			$delBtn.find('span').text('Delete list');
			$addBtn.find('span').text('Add list');

			for (var i = 0; i < mainListArray.length; i++) {
				$('<li>').text(mainListArray[i].name).appendTo($mainCont);
			}
			$indvlCont.hide();
			$mainCont.show();
			if (deleting) { 
				deleting = false;
				$messageCont.hide();
			}
			scrollIconToggle();
		//}
	}

	function loadIndvlList(e) {
		console.log(mainListArray);

		//change these lines so they only trigger if event is called from mainCont
		if (e) {
			var target = e.target;
			var listIndex = $(target).index();
			currentIndex = listIndex;
		} else {
			var listIndex = currentIndex;
		}

		$indvlList.empty();
		$mainCont.hide();
		$indvlCont.show();
		$delBtn.find('span').text('Delete Item');
		$addBtn.find('span').text('Add Item');

		console.log(listIndex);

		$listTitle.val(mainListArray[listIndex].name);
		for (var i = 0; i < mainListArray[listIndex].items.length; i++) {
			//console.log(mainListArray[listIndex].items[i]);
			newListItem(false, true);
			$('.list-item').eq(i).val(mainListArray[listIndex].items[i].content);
			//if element is crossed off
			if (mainListArray[listIndex].items[i].checked) {
				$('.list-item').eq(i).addClass('crossed-off')
					.prop('disabled', true)
					.prev().find('.checkbox').prop('checked', true);
			}
		}

		for (var i = 0; i < allListItems.length; i++) {
			textareaHeight(allListItems[i]);
		}

		//if no list items were made create a new blank bullet
		if (!mainListArray[listIndex].items.length) {
			newListItem();
		}
		scrollIconToggle();
	}



	function deleteList() {
		deleting = !deleting;
		if (deleting && $mainCont.css('display') != 'none') {
			clearTimeout(undoTimer);
			$messageCont.show().children().text('Click list to delete');
			$mainCont.off('click');
			$mainCont.one('click', function(e) {
				var index = $(e.target).index();
				lastDeleted = {
					content: mainListArray.splice(index, 1)[0],
					index: index
				};
				console.log(lastDeleted);
				$mainCont.children().eq(index).remove();
				localStorage.setItem('mainListArray', JSON.stringify(mainListArray));
				deleting = false;
				$messageCont.toggleClass('undo').off('click')
					.one('click', function() {
						console.log('list undo test');
						mainListArray.splice(lastDeleted.index, 0, lastDeleted.content);
						localStorage.setItem('mainListArray', JSON.stringify(mainListArray));
						loadMainList();
						console.log(mainListArray);
						$messageCont.toggleClass('undo').hide();
						clearTimeout(undoTimer);
					})
					.children().text('List deleted. Click here to Undo');
				$mainCont.on('click', function(e) {
					loadIndvlList(e);
				});
				undoTimer = setTimeout(function() {
					$messageCont.toggleClass('undo').hide().off('click');
				}, 2500);
				scrollIconToggle();
			});
		} else if (!deleting && $mainCont.css('display') != 'none') {
			$messageCont.hide();
			$mainCont.off('click');
			$mainCont.on('click', function(e) {
				loadIndvlList(e);
			});
		} else if (deleting && $mainCont.css('display') == 'none') {
			clearTimeout(undoTimer);
			$messageCont.show().children().text('Click item to delete');
			$indvlList.children().children().css('cursor', 'pointer');
			$indvlList.one('click', function(e) { 
				var index = $(e.target).parent().index();
				mainListArray[currentIndex].items.splice(index, 1);
				$indvlList.children().eq(index).remove();
				localStorage.setItem('mainListArray', JSON.stringify(mainListArray));
				deleting = false;
				$messageCont.hide();
				$indvlList.children().children().css('cursor', 'text');
				scrollIconToggle();
			});
		} else if (!deleting && $mainCont.css('display') == 'none') {
			$messageCont.hide();
			$indvlList.off('click');
			$indvlList.children().children().css('cursor', 'text');
		}
	}

	function crossOff(e) {
		//debugger;
		//e.preventDefault;
		var $target = $(e.target);
		var index = $target.parent().parent().index();
		var items = mainListArray[currentIndex].items;
		var itemIndex = items[index].index;
		var removedEl;

		if ($target.is(':checked')) {
			items[index].checked = true;
			//items[index].index = index;
			var crossedItem = items.splice(index, 1)[0];
			items.push(crossedItem);
			localStorage.mainListArray = JSON.stringify(mainListArray);
			$removedEl = $target.parent().parent().detach();
			$removedEl.appendTo($indvlList).find('.list-item').addClass('crossed-off')
				.prop('disabled', true)
				.prev().find('.checkbox').prop('checked', true);
		} else {
			items[index].checked = false;
			var crossedItem = items.splice(index, 1)[0];
			if ($indvlList.children().not(':has(.crossed-off)').length - 1 >= crossedItem.index) {
				items.splice(crossedItem.index, 0, crossedItem);
			} else {
				items.splice($indvlList.children().not(':has(.crossed-off)').length, 0, crossedItem);
			}
			localStorage.mainListArray = JSON.stringify(mainListArray);
			$removedEl = $target.prop('checked', false)
							.parent().next().removeClass('crossed-off').prop('disabled', false)
							.parent().detach();

			if ($indvlList.children().not(':has(.crossed-off)').length - 1 >= itemIndex) {
				$removedEl.insertBefore($indvlList.children().eq(itemIndex));
			} else if ($indvlList.children().not(':has(.crossed-off)').length) {
				$removedEl.insertAfter($indvlList.children().not(':has(.crossed-off)').last());
			} else {
				$removedEl.prependTo($indvlList);
			}
		}
		//$($indvlList).find('.crossed-off').length
	}

});




