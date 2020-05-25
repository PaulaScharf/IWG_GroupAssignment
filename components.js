AFRAME.registerComponent('show-distance-on-gaze', {
	init: function () {
		let el = this.el;
		let popup = document.getElementById("myPopup");
		let infopane = document.getElementById("infopane");
		let componentPosition = el.getAttribute("gps-entity-place");
		let lastDistance;

		/**
		 * If the gaze enters the component call for the current position of the device and then calculate the distance to the
		 * component. Meanwhile already toggle the popup to be visible.
		 * side note: The 'mouseenter' event is also triggered, when an element is clicked.
		 */
		el.addEventListener('mouseenter', function () {
			if(!popup.classList.contains("show")) {
				if(typeof lastDistance !== "undefined") {
					popup.innerText = "distance: " + lastDistance + "m";
				} else {
					popup.innerText = "distance: loading...";
				}
				getPosition().then(function(myPosition) {
					let distance = distanceInKmBetweenEarthCoordinates(componentPosition.latitude, componentPosition.longitude,
						myPosition.coords.latitude, myPosition.coords.longitude);
					lastDistance = Math.round(distance * 100) / 100;
					popup.innerText = "distance: " + lastDistance + "m"
				});
				popup.classList.toggle("show");
			}
			if(infopane.classList.contains("closed")) {
				infopane.classList.toggle("closed");
			}
		});

		/**
		 * If the gaze leaves a component toggle the popup to be invisible again.
		 */
		el.addEventListener('mouseleave', function () {
			if(popup.classList.contains("show")) {
				popup.classList.toggle("show");
			}
			if(!infopane.classList.contains("closed")) {
				infopane.classList.toggle("closed");
			}
		});
	}
});

AFRAME.registerComponent('change-color-on-touch', {
	schema: {
		color: {default: "#ff3133"}
	},

	init: function () {
		var data = this.data;
		var el = this.el;
		let defaultMaterial;
		var self = this;

		/**
		 * when the element is loaded, its initial material is stored in a variable
		 */
		el.addEventListener("model-loaded", e =>{
			let tree3D = el.getObject3D('mesh'); // get the THREEjs group
			if (!tree3D){return;}
			tree3D.traverse(function(node){
				if (node.isMesh){
					if(node.name == "element"){
						defaultMaterial = node.material; // store a reference to the material you want to modify later
					}
				}
			});
		});

		/**
		 * If an element is clicked, it changes to the given color or back to its original material.
		 * side note: The 'click' event is sometimes also triggered, whe an element is just being looked at.
		 */
		el.addEventListener('click', function() {
			let tree3D = el.getObject3D('mesh'); // get the THREEjs group
			if (!tree3D){return;}
			tree3D.traverse(function(node){
				if (node.isMesh){
					let oldColor = node.material.color;
					if ("#" + oldColor.getHexString() === data.color) {
						node.material = defaultMaterial;
					} else {
						var newMaterial = new THREE.MeshStandardMaterial({color: data.color});
						node.material = newMaterial;
					}
				}
			});
		});
	}
});

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
