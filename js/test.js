
var lists = document.getElementsByClassName('list-title');
console.log(lists);

for (var i = 0; i < lists.length; i++) {
	lists[i].disabled = true;
}