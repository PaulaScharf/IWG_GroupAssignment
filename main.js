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
		xhttp.open("GET", "assets/osmtrees_small.geojson", true);
		xhttp.send();
	});
}

window.onload = () => {
	loadPlaces()
		.then(function(trees) {
			// save the extracted trees into the global variabel, so that future access is easier
			treeData = trees;
			scene = document.querySelector('a-scene');
			// for each tree initialize an icon in the AR scene
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
	});
};

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

}