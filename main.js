// this stores the tree-data from the geojson
let treeData;
// this stores which elements of the infobox are editable and what corresponding attribute of the tree-data they contain
let contentIds = [['treeName', 'name'],
	['treeDescription', 'description'],
	['treeHeight', 'height'],
	['treeGenus', 'genus'],
	['treeSpecies', 'species'],
	['img', 'image']];

/**
 * When the window is loaded the tree-data from the geojson is loaded, saved and displayed
 */
window.onload = () => {
	loadTrees()
		.then(function(trees) {
			// save the extracted trees into the global variabel, so that future access is easier
			treeData = trees;
			filterTreesInRange(trees, 1).then(function(nearTrees) {
				renderTrees(nearTrees);
			});
		});
};

/**
 * Load and interpret the trees from the geoJson file.
 * @returns promise to return a list of trees
 */
function loadTrees() {
	return new Promise(function(resolve, reject) {
		var xhttp = new XMLHttpRequest();

		xhttp.onreadystatechange = function () {
			if (this.readyState === 4 && this.status === 200) {
				if (this.responseText.length === 0) {
					reject("The URL field or the content of the field is emtpy.");
				}
				let osmtrees = JSON.parse(this.responseText);
				resolve(osmtrees.features);
			}
		};
		xhttp.open("GET", "assets/osmtrees.geojson", true);
		xhttp.send();
	});
}

/**
 * Calculates all the trees in a given range from a given array.
 * @param trees - array of trees
 * @param range - in km
 * @return promise to return the trees in the given range
 */
function filterTreesInRange(trees, range) {
	return new Promise(function(resolve, reject) {
		let filteredTrees = [];
		// retrieve position of device and use it to calculate distance
		// maybe the distance could also be taken from the a-frame element
		getPosition().then((myPosition) => {
			trees.forEach((tree) => {
				let distance = distanceInKmBetweenEarthCoordinates(tree.geometry.coordinates[1], tree.geometry.coordinates[0],
					myPosition.coords.latitude, myPosition.coords.longitude);
				// if the distance of the tree is inside the range add the tree to the result
				if (distance <= range) {
					filteredTrees.push(tree);
				}
			});
			resolve(filteredTrees);
		});
	});
}

/**
 * for each tree initialize an icon in the AR scene
 * @param trees - array of trees
 */
function renderTrees(trees) {
	scene = document.querySelector('a-scene');
	trees.forEach((tree) => {
		const latitude = tree.geometry.coordinates[1];
		const longitude = tree.geometry.coordinates[0];

		// initialize the a-frame entity
		let icon = document.createElement('a-entity');
		icon.setAttribute('gps-entity-place', `latitude: ${latitude}; longitude: ${longitude}`);
		icon.setAttribute('show-distance-on-gaze', '');
		icon.setAttribute('change-color-on-touch', '');
		icon.setAttribute('affected', tree.properties.affected);

		randomizeTreeProperties(tree);

		// choose the gltf-model for the tree based on its affected-status
		if (tree.properties.affected === "yes") {
			setGeometryGLTF(icon, tree.properties.full_id, 'assets/tree_red.gltf', 5);
		} else if (tree.properties.affected === "maybe") {
			setGeometryGLTF(icon, tree.properties.full_id, 'assets/tree_orange.gltf', 5);
		} else if (tree.properties.affected === "no") {
			setGeometryGLTF(icon, tree.properties.full_id, 'assets/tree.gltf', 5);
			// if the property "affected" is not correctly set, then check if the genus indicates a possible affection
		} else if (tree.properties.genus === "Quercus" || tree.properties.genus === "Cedrus" ||tree.properties.genus === "Abies" ||tree.properties.genus === "Pinus") {
			setGeometryGLTF(icon, tree.properties.full_id, 'assets/tree_orange.gltf', 5);
			icon.setAttribute('affected', "maybe");
			// if there is no hint towards the affection, then just assume the tree is unaffected
		} else {
			setGeometryGLTF(icon, tree.properties.full_id, 'assets/tree.gltf', 5);
			icon.setAttribute('affected', "no");
		}

		// add the created element to the scene
		scene.appendChild(icon);
	});
}

/**
 * This randomizes some properties of a tree. The properties are:
 * "affected", "genus", "name", "height" and "image"
 * @param tree
 */
function randomizeTreeProperties(tree) {
	tree.properties.affected = randomOption(["yes", "maybe", "no", "no"]);
	if (!tree.properties.genus) {
		if (tree.properties.affected === "no") {
			tree.properties.genus = randomOption(["Quercus", "Cedrus", "Abies", "Pinus", "Malus", "Pyrus", "Picea", "Fagus",
				"Tilia", "Carpinus", "Acer", "Ginkgo", "Fraxinus", "Alnus"]);
		} else {
			tree.properties.genus = randomOption(["Quercus", "Cedrus", "Abies", "Pinus"]);
		}
	}
	if (!tree.properties.name) {
		tree.properties.name = randomOption(["","","","","","","","","","","","","peace-tree", "tree of life",
			"friendly tree", "this tree", "old Betty", "Leafy", "young chappy", "major"]);
	}
	if (!tree.properties.height) {
		tree.properties.height = randomOption(["","","","","","","","","","","","","5 meters", "40 meters",
			"10 meters", "7 meters", "20 meters", "25 meters", "17 meters", "4 meters"]);
	}
	if (!tree.properties.image) {
		tree.properties.image = randomOption([
			"https://upload.wikimedia.org/wikipedia/commons/thumb/f/f6/Eichenprozessionsspinner_JPW03.jpg/800px-Eichenprozessionsspinner_JPW03.jpg",
		"https://upload.wikimedia.org/wikipedia/commons/thumb/4/42/Thaumetopoea_processionea_caterpillars_nest.JPG/1280px-Thaumetopoea_processionea_caterpillars_nest.JPG"]);
	}
}

/**
 * this chooses a random option from a list of options.
 * @param options
 * @returns random options
 */
function randomOption(options) {
	let value = Math.floor(Math.random() * options.length);
	return options[value];
}

/**
 * change the 3D-representation of a given icon to a gltf-model.
 * @param icon - the tree icon
 * @param id - the id of the tree
 * @param path - the path to the gltf model
 * @param scale - scale of the gltf model
 */
function setGeometryGLTF(icon, id, path, scale) {
	icon.setAttribute('gltf-model', path);
	icon.setAttribute('scale', '' + scale + ', ' + scale); // if you want for debugging
	icon.setAttribute('look-at', '[gps-camera]');
	icon.setAttribute('id', "tree " + id);
}


/**
 * closes the Infobox and changes the model of the element back to a tree.
 */
function closeInfopane() {
	let infopane = document.querySelector('[id^="infopane"]');
	if(!infopane.classList.contains("closed")) {
		infopane.classList.toggle("closed");
		// end the edit-mode of the infobox if necessary, by turning all textboxes back to uneditable divs
		replaceTextareaWithContent();
		let entity_id = infopane.id.split(' ')[1];
		let icon = document.querySelector('[id$="' + entity_id +'"]');
		// change the gltf-model back to a tree
		switch(icon.getAttribute('affected')) {
			case 'yes':
				setGeometryGLTF(icon, entity_id, 'assets/tree_red.gltf', 5);
				break;
			case 'maybe':
				setGeometryGLTF(icon, entity_id, 'assets/tree_orange.gltf', 5);
				break;
			case 'no':
				setGeometryGLTF(icon, entity_id, 'assets/tree.gltf', 5);
				break;
			default:
				setGeometryGLTF(icon, entity_id, 'assets/tree.gltf', 5);
				//TODO: Fehlermeldung
				break;
		}
	}
}

/**
 * opens the infobox and changes the model of the element to a punctuation-mark.
 */
function openInfopane() {
	let infopane = document.querySelector('[id^="infopane"]');
	if(infopane.classList.contains("closed")) {
		infopane.classList.toggle("closed");
		let entity_id = infopane.id.split(' ')[1];
		let icon = document.querySelector('[id$="' + entity_id +'"]');
		// change the gltf-model to a punctuation-mark
		switch(icon.getAttribute('affected')) {
			case 'yes':
				setGeometryGLTF(icon, entity_id, 'assets/exclamationmark/model.gltf', 800, 2);
				break;
			case 'maybe':
				setGeometryGLTF(icon, entity_id, 'assets/questionmark/scene.gltf', 0.5, 2);
				break;
			case 'no':
				setGeometryGLTF(icon, entity_id, 'assets/sphere/scene.gltf', 8, 4);
				break;
			default:
				setGeometryGLTF(icon, entity_id, 'assets/sphere/scene.gltf', 8, 4);
				//TODO: Fehlermeldung
				break;
		}
	}
}

/**
 * fills the infopane with Information about the tree with the given id
 * @param id - id of the tree
 */
function fillInfoBox(id) {
	// retrieve current tree from tree data
	let currentTree = treeData.filter(tree => {
		return tree.properties.full_id === id;
	});

	// fill the name
	let name = currentTree[0].properties.name;
	if(name === "")
		name = "?";
	document.getElementById("treeName").innerText = name;

	// fill the description
	let description = currentTree[0].properties.description;
	if(description === "")
		description = "no description available for this tree :(";
	document.getElementById("treeDescription").innerText = description;

	// fill the height
	let height = currentTree[0].properties.height;
	if(height === "")
		height = "?";
	document.getElementById("treeHeight").innerText = height;

	// fill the genus
	let genus = currentTree[0].properties.genus;
	if(genus === "")
		genus = "?";
	document.getElementById("treeGenus").innerText = genus;

	// fill the species
	let species = currentTree[0].properties.species;
	if(species === "") {
		species = "?";
	}
	document.getElementById("treeSpecies").innerText = species;

	// set the radio-buttons to the affected-status of the tree
	let radioAffected = document.getElementById("red");
	let radioMaybeAffected = document.getElementById("orange");
	let radioNotAffected = document.getElementById("green");
	switch(currentTree[0].properties.affected) {
		case 'yes':
			radioAffected.checked = true;
			radioMaybeAffected.checked = false;
			radioNotAffected.checked = false;
			break;
		case 'maybe':
			radioAffected.checked = false;
			radioMaybeAffected.checked = true;
			radioNotAffected.checked = false;
			break;
		case 'no':
			radioAffected.checked = false;
			radioMaybeAffected.checked = false;
			radioNotAffected.checked = true;
			break;
		default:
			radioAffected.checked = false;
			radioMaybeAffected.checked = false;
			radioNotAffected.checked = false;
			//TODO: Fehlermeldung
			break;
	}

	// fill the image
	let image = currentTree[0].properties.image;
	if(image != "") {
		let imageContainer = document.getElementById("images");
		let child = document.querySelector('[id^="img"]');
		while (child) {
			imageContainer.removeChild(child);
			child = document.querySelector('[id^="img"]');
		}
		let imageDiv = document.createElement('div');
		imageDiv.style.content = "url(" + image + ")";
		imageDiv.style.width= '80%';
		imageDiv.id = "img";
		imageContainer.prepend(imageDiv);
	}

	// reset the edit button
	document.getElementById("editButton").setAttribute("onclick", "replaceContentWithTextareas('" + id + "')")
}

/**
 * open or close the content of a collapsible element.
 * @param idContent - id of the content of the collapsible
 * @param idLabel - id of the label-element of the collapsible
 */
function openCollapsible(idContent, idLabel) {
	document.getElementById(idLabel).classList.toggle("active");
	let content = document.getElementById(idContent);
	if (content.style.maxHeight){
		content.style.maxHeight = null;
	} else {
		content.style.maxHeight = content.scrollHeight + "px";
	}
}

/**
 * This replaces the content of the infobox with textareas. It is used, when the edit mode is started.
 */
function replaceContentWithTextareas() {
	contentIds.forEach((id) => {
		let viewableText = document.getElementById(id[0]);
		// create an editable textarea
		let editableText = document.createElement('textarea');
		editableText.innerText = viewableText.innerText;
		editableText.setAttribute("id", id[0]);
		let className = viewableText.getAttribute("class");
		editableText.setAttribute("class", className);
		if (className != null && className.includes("collapsibleContent")) {
			//TODO:collapse/decollapse everything
		}
		editableText.style.color = "#000000";
		editableText.style.maxHeight = viewableText.scrollHeight + "px";
		editableText.style.maxWidth = viewableText.scrollWidth + "px";
		viewableText.replaceWith(editableText);
	});
	let editButton = document.getElementById("editButton");
	if (editButton) {
		editButton.setAttribute("onclick", "replaceTextareaWithContent()");
		editButton.innerText = "Done";
	}
	let editButtonImg = document.getElementById("editButtonImg");
	if (editButtonImg) {
		editButtonImg.setAttribute("onclick", "replaceTextareaWithContent()");
		editButtonImg.innerText = "Done";
	}
}

/**
 * This replaces the textareas of the infobox with normal divs. It is used when the edit mode ends.
 */
function replaceTextareaWithContent() {
	let treeId =  document.querySelector('[id^="infopane"]').getAttribute("id").split(' ')[1];
	// for each of the editable elements of the infobox...
	contentIds.forEach((id) => {
		let editableText = document.getElementById(id[0]);
		// check if element is currently a textarea
		if (editableText.tagName === "TEXTAREA") {
			// create div which is not editable
			let viewableText = document.createElement('h');
			viewableText.innerText = editableText.value;
			// update tree-data with the value of the textarea
			updateTreeData(treeId, id[1], editableText.value);
			viewableText.setAttribute("id", id[0]);
			let className = editableText.getAttribute("class");
			viewableText.setAttribute("class", className);
			if (className != null && className.includes("collapsibleContent")) {
				//TODO:collapse or decollapse everything
			}
			viewableText.style.maxHeight = editableText.scrollHeight + "px";
			editableText.replaceWith(viewableText);
		}
	});
	let editButton = document.getElementById("editButton");
	if (editButton) {
		editButton.setAttribute("onclick", "replaceContentWithTextareas()");
		editButton.innerText = "Edit";
	}
	let editButtonImg = document.getElementById("editButtonImg");
	if (editButtonImg) {
		editButtonImg.setAttribute("onclick", "replaceTextareaWithContent()");
		editButtonImg.innerText = "Edit";
	}
}

/**
 * updates a value of a given key of a given tree
 * @param treeId - id of the tree-data entry
 * @param key - name of the attribute
 * @param value - new value of the attribute
 */
function updateTreeData(treeId, key, value) {
	let currentTree = treeData.filter(tree => {
		return tree.properties.full_id === treeId;
	});
	currentTree[0].properties[key] = value;
}

/**
 * convert from degrees to radians
 * @see https://stackoverflow.com/a/365853
 * @param degrees
 * @returns radians
 */
function degreesToRadians(degrees) {
	return degrees * Math.PI / 180;
}

/**
 * calculate distance (in km) between two gps coordinates, defined by latitude and longitude, using the haversine formula.
 * @see https://stackoverflow.com/a/365853
 * @param lat1
 * @param lon1
 * @param lat2
 * @param lon2
 * @returns distance in km
 */
function distanceInKmBetweenEarthCoordinates(lat1, lon1, lat2, lon2) {
	var earthRadiusKm = 6371;

	var dLat = degreesToRadians(lat2-lat1);
	var dLon = degreesToRadians(lon2-lon1);

	lat1 = degreesToRadians(lat1);
	lat2 = degreesToRadians(lat2);

	var a = Math.sin(dLat/2) * Math.sin(dLat/2) +
		Math.sin(dLon/2) * Math.sin(dLon/2) * Math.cos(lat1) * Math.cos(lat2);
	var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
	return earthRadiusKm * c;
}

/**
 * Get current gps position
 * @returns Promise that will resolve in the current location
 */
function getPosition() {
	return new Promise(function(resolve, reject) {
		try {
			navigator.geolocation.getCurrentPosition(function (position) {
				resolve(position);
			});
		} catch (e) {
			reject(e);
		}
	});
}

/**
 * The infobox contains several possible contents which are grouped under one id.
 * This function hides one content and makes a different content visible.
 * @param oldId - id of the previously displayed content
 * @param newId - id of the new current content
 */
function switchInfoboxContent(oldId, newId) {
	if (oldId == "characteristics" || oldId == "images") {
		replaceTextareaWithContent();
	}
	document.getElementById(oldId).style.display = "none";
	document.getElementById(newId).style.display = "block";
}

/**
 * change the gltf-model, element-attribute and entry in the tree-data to the value of the radio-buttons
 */
function changeAffectedStatus() {
	let infopane = document.querySelector('[id^="infopane"]');
	let entity_id = infopane.id.split(' ')[1];
	let icon = document.querySelector('[id$="' + entity_id +'"]');
	// affected
	if(document.getElementById('red').checked) {
		setGeometryGLTF(icon, entity_id, 'assets/exclamationmark/model.gltf', 800, 2);
		icon.setAttribute('affected', "yes");
		updateTreeData(entity_id, "affected", "yes");
		// possibly affected
	} else if(document.getElementById('orange').checked) {
		setGeometryGLTF(icon, entity_id, 'assets/questionmark/scene.gltf', 0.5, 2);
		icon.setAttribute('affected', "maybe");
		updateTreeData(entity_id, "affected", "maybe");
		// healthy
	} else if(document.getElementById("green").checked){
		setGeometryGLTF(icon, entity_id, 'assets/sphere/scene.gltf', 8, 4);
		icon.setAttribute('affected', "no");
		updateTreeData(entity_id, "affected", "no");
	}
}