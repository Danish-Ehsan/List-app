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

	//localStorage.clear();

	console.log(localStorage.mainListArray);

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
			mainListArray.push({items: []});

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
	});

	$delBtn.on('click', deleteList);

	$backBtn.on('click', function() {
		//delete new list if inputs were blank
		if ($mainCont.css('display') == 'none') { 
			if (!mainListArray[mainListArray.length - 1].name && !mainListArray[mainListArray.length - 1].items.length) {
				mainListArray.splice((mainListArray.length - 1), 1);
			//if title left blank replace with 'unnamed'
			} else if (!mainListArray[mainListArray.length - 1].name && mainListArray[mainListArray.length - 1].items) {
				mainListArray[mainListArray.length -1].name = 'unnamed';
			}
			loadMainList();
		}
	});

	$mainCont.on('click', function(e) {
		loadIndvlList(e);
	});

	$settingsIcon.on('click', function() {
		$(this).toggleClass('active');
		$settingsMenu.toggleClass('active');
	})


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
				mainListArray[currentIndex].items[listIndex] = target.value;
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

	function newListItem(focus) {
		var $listItem = $('<li>').appendTo($indvlList);
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

		$listItem.on('keydown', function(e) {
			$target = $(e.target);
			//if key is ENTER or DOWN-ARROW
			if (e.which == 13 || e.which == 40) {
				if ($listItem.index() >= allListItems.length - 1) {
					console.log('$listItem index= ' + $listItem.index());
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

		if($thisList.prop('scrollHeight') > $thisList.height() && $scrollIcon.css('display') == 'none') {
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
		var target = e.target;
		var listIndex = $(target).index();
		currentIndex = listIndex;

		$indvlList.empty();
		$mainCont.hide();
		$indvlCont.show();
		$delBtn.find('span').text('Delete Item');
		$addBtn.find('span').text('Add Item');

		console.log(listIndex);

		$listTitle.val(mainListArray[listIndex].name);
		for (var i = 0; i < mainListArray[listIndex].items.length; i++) {
			//console.log(mainListArray[listIndex].items[i]);
			newListItem();
			$('.list-item').eq(i).val(mainListArray[listIndex].items[i]);
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



});




