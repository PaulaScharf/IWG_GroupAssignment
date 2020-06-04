AFRAME.registerComponent('show-distance-on-gaze', {
	init: function () {
		let el = this.el;
		let popup = document.getElementById("myPopup");
		let infopane = document.getElementById("infopane");
		let componentPosition = el.getAttribute("gps-entity-place");

		/**
		 * If the gaze enters the component call for the current position of the device and then calculate the distance to the
		 * component. Meanwhile already toggle the popup to be visible.
		 * side note: The 'mouseenter' event is also triggered, when an element is clicked.
		 */
		el.addEventListener('mouseenter', function () {
			if(!popup.classList.contains("show")) {
				let distance = Math.round(el.getAttribute("distance") * 100) / 100;
				popup.innerText = "distance: " + distance + "m";
				popup.classList.toggle("show");
			}
			if(infopane.classList.contains("closed")) {
				fillInfoPane(el.id);
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
