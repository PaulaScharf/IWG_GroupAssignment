AFRAME.registerComponent('show-distance-on-gaze', {
	init: function () {
		let el = this.el;
		let popup = document.getElementById("myPopup");
		let infopane = document.querySelector('[id^="infopane"]');
		let componentPosition = el.getAttribute("gps-entity-place");
		let id = el.id.split(' ')[1];

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
			setCurrentTree(id);
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
		});

		/**
		 * Takes care of changing the model of the currently and previously looked at tree and updates the infopane to the current tree
		 * @param id - id of the currently looked at tree
		 */
		function setCurrentTree(id) {
			// id of the previously looked at tree
			let previous_id = infopane.id.split(' ')[1];
			// if the same tree is looked at as before, nothing has to change
			if(previous_id != id) {
				// if a tree has been looked at, before this tree, its model has to change back to the original tree model
				if(typeof previous_id != "undefined" && previous_id != "") {
					replaceTextareaWithContent();
					let previous_element = document.getElementById("tree " + previous_id);
					switch(previous_element.getAttribute('affected')) {
						case 'yes':
							setGeometryGLTF(previous_element, previous_id, 'assets/tree_red.gltf', 5);
							break;
						case 'maybe':
							setGeometryGLTF(previous_element, previous_id, 'assets/tree_orange.gltf', 5);
							break;
						case 'no':
							setGeometryGLTF(previous_element, previous_id, 'assets/tree.gltf', 5);
							break;
						default:
							setGeometryGLTF(previous_element, previous_id, 'assets/tree.gltf', 5);
							//TODO: Fehlermeldung
							break;
					}
				}
				switch(el.getAttribute('affected')) {
					case 'yes':
						setGeometryGLTF(el, id, 'assets/exclamationmark/model.gltf', 800);
						break;
					case 'maybe':
						setGeometryGLTF(el, id, 'assets/questionmark/scene.gltf', 0.5);
						break;
					case 'no':
						setGeometryGLTF(el, id, 'assets/sphere/scene.gltf', 8);
						break;
					default:
						setGeometryGLTF(el, id, 'assets/sphere/scene.gltf', 8);
						//TODO: Fehlermeldung
						break;
				}
				fillInfoPane(id);
				// indicate which tree the infopane displays information about
				infopane.id = "infopane " + id;
				// indicate that the infopane contains information
				infopane.classList.toggle("filled")
			}
		}
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
