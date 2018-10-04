/**Number of different lines of inputs (a line is composed by an input for a character and one for a frequency).
@type {Number}*/ 
var inputs = 1;

/**Default code for an line of inputs.
@type {String}*/
var divInput = '<div class="form-group form-row"><div class="col" data-content="Character missing" data-placement="left"><input type="text" class="carinput form-control form-control-sm" placeholder="Character"></div><div class="col" data-content="Weight missing" data-placement="right"><input type="number" class="occinput form-control form-control-sm" min="0" step="any" placeholder="Weight"><div></div>';

/**
Frequencies of the 26 latin characters in the French language.
It was generated by typing the values found on the web into this page.
@type {String}
*/
var frenchJsonDict = '[[99.97,[40.28,[17.3,[8.4,"a"],[8.9,[4.18,"d"],[4.72,[2.18,[1.06,"b"],[1.12,"f"]],[2.54,[1.27,"g"],[1.27,[0.51,[0.21,[0.09,[0.04,"w"],[0.05,"k"]],[0.12,"z"]],[0.3,"y"]],[0.76,[0.31,"j"],[0.45,"x"]]]]]]],[22.98,[11,[5.26,"o"],[5.74,"u"]],[11.98,[5.97,[2.96,"m"],[3.01,"p"]],[6.01,"l"]]]],[59.69,[27.01,[12.81,[6.26,[3.03,"c"],[3.23,[1.32,"v"],[1.91,[0.92,"h"],[0.99,"q"]]]],[6.55,"r"]],[14.2,[7.07,"t"],[7.13,"n"]]],[32.68,[15.42,[7.34,"i"],[8.08,"s"]],[17.26,"e"]]]]]';

/**
Variable used to store binary codes generated by the script.
@type {Object}
*/
var codes;

/**Name of the localStorage key to access the keys and names of the stored dictionnaries.
@type {String}*/
var dictListName = "dictList";

// Adds to the HTML the first row of inputs
$('#inputsValues').append(divInput);

// Initializes the tooltips when a field is missing in a row of inputs
$('[data-toggle]').popover();

/**
Is used to save or retrieve a localStorage value (a string saved to the user's browser).
@param {String} key - Key used to save and name the dictionnary.
@param {String} [string=""] - String to be saved to the browser. If not used, it will be used to try to retrieve the value at the key.
@returns {(Boolean|String)} Returns true if the setItem worked, false if the getItem at key didn't find an object or the value if it found it.
*/
function manageStorage(key, string=""){
	// If a string is given, we edit the item at the key.
	if(string){
		localStorage.setItem(key, string);
		return true;
	// If no string is given, we are looking to retrieve the item at the key.
	}else{
		var value;
		if(value = localStorage.getItem(key)){
			return value;
		}else{
			return false;
		}
	}
}

/**
Is used to save or update a named dictionnary representing a tree into the browser's local storage as a JSONified string.
@param {Tree} dict - Tree to save.
@param {String} label - Name of the tree.
*/
function saveDict(dict, label){
	dict = JSON.stringify(dict);
	// We use our local function to store the new JSONified dictionnary
	manageStorage(label, dict);
	// It is used to retrieve the names of stored trees.
	var dictList;
	console.log("Dictionnary saved.")

	// If a dictionnary list already existed, we retrieve it.
	if(dictList = manageStorage(dictListName)){
		// Dictionnaries' name are stored as a string separated by a dot.
		dictList = dictList.split(".");
		// If we don't find in the list the name of the dictionnary to save, we add it.
		if(dictList.indexOf(label) == -1){
			dictList.push(label);
			dictList = dictList.join(".");
			manageStorage(dictListName, dictList);
			console.log("New key added in dictionnary list.");
		}
	// If no list was already saved, we just save our dictionnary list into a new dictionnary list.
	}else{
		manageStorage(dictListName, label);
		console.log("No previous dictionnary list existed. Created a new one.");
	}

	// Updates the list of dictionnaries to load.
	updateDictSelect();
}

/**
Deletes the dictionnary from the user's browser.
@param {string} label - Name of the stored tree to delete.
*/
function removeDict(label){
	localStorage.removeItem(label);
	// We retrieve all labels as an array.
	var listDicts = localStorage.getItem(dictListName).split(".");
	// We found the label and remove it from the array, which we put back together with dots.
	var indexLabel = listDicts.indexOf(label);
	listDicts.splice(indexLabel, 1);
	listDicts = listDicts.join(".");
	// If our list doesn't have at least a dictionnary, we clear all of the storage. Else we save the new list.
	if(listDicts.length > 0){
		manageStorage(dictListName, listDicts);
	}else{
		localStorage.clear();
	}

	// Updates the list of dictionnaries to load.
	updateDictSelect();
}

/**
Generates the select field which displays all saved trees and allows to select one.
*/
function updateDictSelect(){
	// Clears the select content.
	$("#savedDicts").html("");
	var listDicts = localStorage.getItem(dictListName);
	// If dictionnaries are stored we add them to the select. Else we just add a simple option to display to the user.
	if(listDicts){
		listDicts = listDicts.split(".");
		$('#savedDicts').append("<option disabled selected>Choose a tree</option>");
		for(var value in listDicts){
			$("#savedDicts").append("<option value=\""+ listDicts[value] +"\">"+ listDicts[value] +"</option>");
		}
	}else{
		$('#savedDicts').append("<option disabled selected>No tree saved</option>");
	}
}

/**
Used to check whether an input is empty or not.
@param {jQuery} item - A jQuery's input selector.
*/
function isFieldEmpty(item){
	if(item.val()){
		return false;
	}else{
		return true;
	}
}

/**
Creates the binary codes from a tree.
@param {Tree} tree - Tree to use to generate binary codes for each character.
*/
function createCodeFromTree(tree){

	var codes = {};


	/**
	Recursive function used to attribute binary codes to each leaf (each character)
	by branching through each node and adding a "0" or "1" to the binary code if we either go to the "left" or "right".
	A tree is an array representative of a Huffman tree, with each array within being another node or a leaf.
	Each array has at index 0 the sum of the weights of both branches.
	Index 1 and 2 represent a branch and are arrays. If you go into them, you can find another node or a leaf.
	A leaf will have at index 0 the frequency (the weight) of its character, and at index 1 the character itself.
	@param {Tree} node - A node of the tree, which can be the root to launch the recursive function.
	@param {String} code - Current binary code as a string for the current node.
	*/
	function seekInBranch(node, code){

		if(Array.isArray(node[1])){
			seekInBranch(node[1], (code+"1"));
		}else{
			codes[node[1]] = code;
			console.log(`Found character, adding "${code}" for ${node[1]}`);
		}

		if(node[2]){

			if(Array.isArray(node[2])){
				seekInBranch(node[2], (code+"0"));
			}else{
				codes[node[2]] = code;
				console.log(`Found character, adding "${code} for ${node[2]}"`);
			}

		}

	}

	// We start from the top node, and the recursive function will reach every leaf.
	seekInBranch(tree[0], "");

	console.log(`Codes: ${JSON.stringify(codes)}`);
	return codes;

}

/**
Creates a tree from an array of values.
@param {Array} table - Array of characters and frequencies. Ex: [[50, "A"], [60, "B"], [20, "C"]]
@returns {Tree} The tree created from the given table.
*/
function createTreeFromArray(table){

	// Number of max decimals to process.
	var decimals = 4;

	// We sort each character's array by its weight at index 0. After that weights at the beginning are the least important, and those at the end are the most important.
	table.sort(function(a,b){
		return a[0]-b[0];
	});

	var i = 0;
	var iterateMax = table.length;
	console.log(`Iterations max : ${iterateMax}`);
	
	while(table.length > 1 && i <= iterateMax){
		var newWeight = parseFloat((table[0][0] + table[1][0]).toFixed(decimals));
		var newNode = [newWeight, table[0], table[1]];
		table.push(newNode);
		table.splice(0,2);
		table.sort(function(a,b){
			return a[0]-b[0];
		});
		i++;
	}

	console.log(`Tree: ${JSON.stringify(table)}`);
	return table;

}

/**
Used to check all created inputs and create an array with the values in it.
It also adds a warning if a input is invalid.
@returns {Array} Array of characters and frequencies used to later create a tree.
*/
function checkInputs(){
	
	var results = [];
	
	$('#inputsValues > div').each(function(){
		if(!isFieldEmpty($(this).find(".carinput")) && !isFieldEmpty($(this).find(".occinput"))){
			var car = $(this).find("div > .carinput").val();
			var occ = parseFloat($(this).find("div > .occinput").val());
			results.push([occ, car]);
		}else if(!isFieldEmpty($(this).find(".carinput"))){
			$(this).find(".occinput").addClass("is-invalid");
			$(this).find(".occinput").parent().popover("show");
		}else if(!isFieldEmpty($(this).find(".occinput"))){
			$(this).find(".carinput").addClass("is-invalid");
			$(this).find(".carinput").parent().popover("show");
		}
	});

	console.log(`${JSON.stringify(results)} : ${results.length} items`);
	return results;
}

/**
Used to add or remove lines of inputs if they are fully completed or if more than one line is empty.
@param {jQuery} item - Wrapper jQuery item of the lines of inputs.
*/
function manageInputs(item){

	if(isFieldEmpty(item.find(".carinput")) && isFieldEmpty(item.find(".occinput")) && inputs > 1){
		item.remove();
		inputs--;
	}else if(item.is(":last-child")){
		item.parent().append(divInput);
		inputs++;
	}
	console.log(`${inputs} inputs.`);

	manageSubmitDict();

}

/**
Enables or disables the button to create the tree according to the number of completed inputs.
*/
function manageSubmitDict(){

	if(inputs > 1){
		$('#submitDict').removeAttr("disabled");
		console.log("Enabling submit dictionnary button");
	}else{
		$('#submitDict').attr("disabled", "disabled");
		console.log("Disabling submit dictionnary button");
	}

}

/**
Creates an HTML table to display the binary codes generated by a tree.
@param {BinaryCodes} obj - Dictionnary of binary codes generated with createCodeFromTree().
@returns {String} The HTML code of the table.
*/
function createHtmlTableFromObject(obj){
	var html = $("<table></table>");
	html.addClass("table table-striped table-condensed");
	html.html("<thead><tr><th>Character</th><th>Code</th></tr></thead><tbody></tbody>");
	html.find("thead").addClass("thead-light");
	for(var key in obj){
		html.children("tbody").append(`<tr><td>"${key}"</td><td>${obj[key]}</td></tr>`);
	}
	return html;
}

$('body').on('change', 'input.carinput, input.occinput', function(){
	manageInputs($(this).parent().parent());
	if(!isFieldEmpty($(this))){
		$(this).parent().popover("hide");
		$(this).parent().parent().find(".is-invalid").removeClass("is-invalid");
	}
});

$('#dict').on('submit', function(event){
	event.preventDefault();

	var results = checkInputs();
	
	results = createTreeFromArray(results);
	if(results.length > 0){

		codes = createCodeFromTree(results);
		$('#dictCodes').html(createHtmlTableFromObject(codes));

		$('#saveDict').removeAttr("disabled");
		$('#dictCodesCollapse').collapse("show");

	}

});

$('#dictNameCollapse').on('hide.bs.collapse', function(){
	var userDictName = $('#dictName').val();
	$('#dictName').val("");
	saveDict(codes, userDictName);
});

$('#dictNameCollapse').on('shown.bs.collapse', function(){
	$('#dictName').focus();
});

$("#savedDicts").on("change", function(){
	$("#loadDictButton").removeAttr("disabled");
	$('#deleteDictButton').removeAttr("disabled");
});

$('#loadDict').on("submit", function(event){
	event.preventDefault();
	var jsonDict = JSON.parse(manageStorage($('#savedDicts').val()));
	$('#dictCodes').html(createHtmlTableFromObject(jsonDict));
	$('#dictCodesCollapse').collapse("show");
});

$("#deleteDictButton").on("click", function(){
	removeDict($('#savedDicts').val());
});

$(document).ready(function(){
	saveDict(createCodeFromTree(JSON.parse(frenchJsonDict)), "French");
	updateDictSelect();
});