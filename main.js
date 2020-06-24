// this stores the trees
let treeData;
let contentIds = [['treeName', 'name'],
	['treeDescription', 'description'],
	['treeHeight', 'height'],
	['treeGenus', 'genus'],
	['treeSpecies', 'species']];
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
 * Calculates all the trees in a given range from a given array.
 * @param trees - array of trees
 * @param range - in km
 */
function filterTreesInRange(trees, range) {
	return new Promise(function(resolve, reject) {
		let filteredTrees = [];
		getPosition().then((myPosition) => {
			trees.forEach((tree) => {
				let distance = distanceInKmBetweenEarthCoordinates(tree.geometry.coordinates[1], tree.geometry.coordinates[0],
					myPosition.coords.latitude, myPosition.coords.longitude);
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
 * @param trees
 */
function renderTrees(trees) {
	scene = document.querySelector('a-scene');
	trees.forEach((tree) => {
		const latitude = tree.geometry.coordinates[1];
		const longitude = tree.geometry.coordinates[0];

		let icon = document.createElement('a-entity');
		icon.setAttribute('gps-entity-place', `latitude: ${latitude}; longitude: ${longitude}`);
		icon.setAttribute('show-distance-on-gaze', '');
		icon.setAttribute('change-color-on-touch', '');
		if (tree.properties.affected) {
			setGeometryGLTF(icon, tree.properties.full_id, 'assets/tree_red.gltf', 5);
			icon.setAttribute('affected', "yes");
		} else if (tree.properties.genus == "Quercus" || tree.properties.genus == "Cedrus" ||tree.properties.genus == "Abies" ||tree.properties.genus == "Pinus") {
			setGeometryGLTF(icon, tree.properties.full_id, 'assets/tree_orange.gltf', 5);
			icon.setAttribute('affected', "maybe");
		} else {
			setGeometryGLTF(icon, tree.properties.full_id, 'assets/tree.gltf', 5);
			icon.setAttribute('affected', "no");
		}

		scene.appendChild(icon);
	});
}

/**
 * change the 3D-representation of a given icon to a sphere.
 * @param icon
 * @param id
 */
function setGeometrySphere(icon, id) {
	if(icon.hasAttribute('gltf-model')) {
		icon.removeAttribute('gltf-model');
	}
	icon.setAttribute('geometry', 'primitive: sphere');
	icon.setAttribute('color', '#2e9916');
	icon.setAttribute('look-at', '[gps-camera]');
	icon.setAttribute('material', 'opacity: 1');
	icon.setAttribute('rotation', '0 0 0');
	icon.setAttribute('radius', '10');
	icon.setAttribute('scale', '5 5 5');
	icon.setAttribute('id', "tree " + id);
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
	//TODO: should the models always be oriented towards the camera?
	//icon.setAttribute('look-at', '[gps-camera]');
	icon.setAttribute('id', "tree " + id);
}


/**
 * closes the Infopane
 */
function closeInfopane() {
	let infopane = document.querySelector('[id^="infopane"]');
	if(!infopane.classList.contains("closed")) {
		infopane.classList.toggle("closed");
		let entity_id = infopane.id.split(' ')[1];
		let icon = document.querySelector('[id$="' + entity_id +'"]');
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
 * opens the infopane
 */
function openInfopane() {
	let infopane = document.querySelector('[id^="infopane"]');
	if(infopane.classList.contains("closed")) {
		infopane.classList.toggle("closed");
		let entity_id = infopane.id.split(' ')[1];
		let icon = document.querySelector('[id$="' + entity_id +'"]');
		switch(icon.getAttribute('affected')) {
			case 'yes':
				setGeometryGLTF(icon, entity_id, 'assets/exclamationmark/model.gltf', 800);
				break;
			case 'maybe':
				setGeometryGLTF(icon, entity_id, 'assets/questionmark/scene.gltf', 0.5);
				break;
			case 'no':
				setGeometryGLTF(icon, entity_id, 'assets/sphere/scene.gltf', 8);
				break;
			default:
				setGeometryGLTF(icon, entity_id, 'assets/sphere/scene.gltf', 8);
				//TODO: Fehlermeldung
				break;
		}
	}
}

/**
 * fills the infopane with Information about the tree with the given id
 * @param id - id of the tree
 */
function fillInfoPane(id) {
	let infocontainer = document.getElementById("infocontainer");
	let currentTree = treeData.filter(tree => {
		return tree.properties.full_id === id;
	});
	let name = currentTree[0].properties.name;
	if(name === "")
		name = "XXX";
	document.getElementById("treeName").innerText = name;
	let description = currentTree[0].properties.description;
	if(description === "")
		description = "no description available for this tree :(";
	document.getElementById("treeDescription").innerText = description;
	let height = currentTree[0].properties.height;
	if(height === "")
		height = "?";
	document.getElementById("treeHeight").innerText = height;
	let genus = currentTree[0].properties.genus;
	if(genus === "")
		genus = "?";
	document.getElementById("treeGenus").innerText = genus;
	let species = currentTree[0].properties.species;
	if(species === "")
		species = "?";
	document.getElementById("treeSpecies").innerText = species;
	document.getElementById("editButton").setAttribute("onclick", "replaceContentWithTextareas('" + id + "')")
}

/**
 * open or close the content of a collapsible element.
 * @param idContent
 * @param idLabel
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
 *
 * @param treeId
 */
function replaceContentWithTextareas(treeId) {
	contentIds.forEach((id) => {
		let viewableText = document.getElementById(id[0]);
		let editableText = document.createElement('textarea');
		editableText.innerText = viewableText.innerText;
		editableText.setAttribute("id", id[0]);
		let className = viewableText.getAttribute("class");
		editableText.setAttribute("class", className);
		if (className != null && className.includes("collapsibleContent")) {
			//TODO
		}
		editableText.style.color = "#000000";
		viewableText.replaceWith(editableText);
	});

	document.getElementById("editButton").setAttribute("onclick", "replaceTextareaWithContent('" + treeId + "')");
}

/**
 *
 * @param treeId
 */
function replaceTextareaWithContent(treeId) {
	contentIds.forEach((id) => {
		let editableText = document.getElementById(id[0]);
		let viewableText = document.createElement('h');
		viewableText.innerText = editableText.value;
		updateTreeData(treeId, id[1], editableText.value);
		viewableText.setAttribute("id", id[0]);
		let className = editableText.getAttribute("class");
		viewableText.setAttribute("class", className);
		if (className != null && className.includes("collapsibleContent")) {
			//TODO
		}
		editableText.replaceWith(viewableText);
	});

	document.getElementById("editButton").setAttribute("onclick", "replaceContentWithTextareas('" + treeId + "')");
}

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
