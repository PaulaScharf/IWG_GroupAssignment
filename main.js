// this stores the trees
let treeData;
/**
 * Load and interpret the trees from the geoJson file.
 * @returns promise to return a list of trees
 */
function loadPlaces() {
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
	loadPlaces()
		.then(function(trees) {
			// save the extracted trees into the global variabel, so that future access is easier
			treeData = trees;
			filterTreesInRange(trees, 1).then(function(nearTrees) {
				renderTrees(nearTrees);
			});
	});
};

/**
 *
 * @param trees
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
		const icon = document.createElement('a-image');
		icon.setAttribute('gps-entity-place', `latitude: ${latitude}; longitude: ${longitude}`);
		// visualize the tree using the model from assignment 1
		icon.setAttribute('gltf-model', 'assets/tree.gltf');
		icon.setAttribute('look-at', '[gps-camera]');
		icon.setAttribute('show-distance-on-gaze', '');
		icon.setAttribute('change-color-on-touch', '');
		icon.setAttribute('scale', '5, 5'); // if you want for debugging
		icon.setAttribute('id', tree.properties.full_id);
		scene.appendChild(icon);
	});
}

/**
 * closes the Infopane
 */
function closeInfopane() {
	let infopane = document.getElementById("infopane");
	if(!infopane.classList.contains("closed")) {
		infopane.classList.toggle("closed");
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
}

/**
 *
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
