/* datasource-color-size.js */

APP.factory(
	'Loader', 
function (
	$rootScope
) {

	var Self = {};

	Self.Required = {
		'ProductsCategories': false,
		'FamiliesCategories': false,
		'Images': false,
		'AgoraFieldsFootprint': false,
		'Products': false,
		'ColorSize': false,
		'MaxUploadSize': false,
		'FamiliesCategories': false
	};
	
	Self.Ready = false;

	function check() {

		var Ready = true;
		var Count = 0;

		Object.keys(Self.Required)
		.forEach(function(Key) {

			if(!Self.Required[Key]) {

				Ready = false;
			} else {

				Count++;
			}
		});

		if(Ready) {

			$rootScope.$broadcast('loaderready');

		} else {

			$rootScope.$broadcast('loadernotready', { Count: Count });
		}
	}

	Self.loaded = function(Key) {

		Self.Required[Key] = true;
		check();
	}

	Self.toLoad = function(Key) {		

		Self.Required[Key] = false;
		check();
	}

	return Self;
});
	