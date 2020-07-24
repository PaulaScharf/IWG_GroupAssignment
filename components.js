/**
 * This component contains the infobox and the distance-popup.
 * The infobox is opened and updated, whenever you are looking at the element. It has to be closed manually.
 * The distance-popup is only displayed, while you are looking at the element.
 */
AFRAME.registerComponent('show-distance-on-gaze', {
	init: function () {
		let el = this.el;
		let popup = document.getElementById("myPopup");
		let infopane = document.querySelector('[id^="infopane"]');
		let id = el.id.split(' ')[1];

		/**
		 * If the gaze enters the component the infobox and the distance-popup are opened. The content of the popup is
		 * set to the distance. The infobox is filled with information about the current tree.
		 * side note: The 'mouseenter' event is also triggered, when an element is clicked.
		 */
		el.addEventListener('mouseenter', function () {
			if(!popup.classList.contains("show")) {
				let distance = Math.round(el.getAttribute("distance") * 100) / 100;
				// fill popup
				popup.innerText = "distance: " + distance + "m";
				// show popup
				popup.classList.toggle("show");
			}
			// fill infobox
			setCurrentTree(id);
			// open infobox
			if(infopane.classList.contains("closed")) {
				infopane.classList.toggle("closed");
			}
		});

		/**
		 * If the gaze leaves a component toggle the popup to be invisible again.
		 */
		el.addEventListener('mouseleave', function () {
			if(popup.classList.contains("show")) {
				// hide popup
				popup.classList.toggle("show");
			}
		});

		/**
		 * Takes care of changing the model of the currently and previously looked at tree and updates the infopane to
		 * information about the current tree.
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
					// change the previously looked at tree back to a tree model
					switch(previous_element.getAttribute('affected')) {
						case 'yes':
							// set model for affected
							setGeometryGLTF(previous_element, previous_id, 'assets/tree_red.gltf', 5);
							break;
						case 'maybe':
							// set model for potentially affected
							setGeometryGLTF(previous_element, previous_id, 'assets/tree_orange.gltf', 5);
							break;
						case 'no':
							// set model for healthy
							setGeometryGLTF(previous_element, previous_id, 'assets/tree.gltf', 5);
							break;
						default:
							// if no information about the affected-status is given, assume that the tree is healthy
							setGeometryGLTF(previous_element, previous_id, 'assets/tree.gltf', 5);
							//TODO: Fehlermeldung
							break;
					}
				}
				// display the currently looked at tree as a punctuation-mark
				switch(el.getAttribute('affected')) {
					case 'yes':
						// set model for affected
						setGeometryGLTF(el, id, 'assets/exclamationmark/model.gltf', 800);
						break;
					case 'maybe':
						// set model for potentially affected
						setGeometryGLTF(el, id, 'assets/questionmark/scene.gltf', 0.5);
						break;
					case 'no':
						// set model for healthy
						setGeometryGLTF(el, id, 'assets/sphere/scene.gltf', 8);
						break;
					default:
						// if no information about the affected-status is given, assume that the tree is healthy
						setGeometryGLTF(el, id, 'assets/sphere/scene.gltf', 8);
						//TODO: Fehlermeldung
						break;
				}
				// fill infobox with info about current tree
				fillInfoBox(id);
				// indicate which tree the infopane displays information about
				infopane.id = "infopane " + id;
				if(infopane.classList.contains("filled")) {
					// indicate that the infopane contains information
					infopane.classList.toggle("filled")
				}
			}
		}
	}
});
