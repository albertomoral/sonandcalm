/* datasource-sku-parent.js */

APP.factory(
	'Loader', 
function (
	$rootScope
) {

	var Self = {};
	var Debug = false;
	var Loaded = {
		'ProductsCategories': false,
		'FamiliesCategories': false,
		'ColorSize': false,
		'MaxUploadSize': false,
		'Images': false,
		'ProductsStock': false,
		'FieldsFootPrint': false,
		'ParentSKU': false,
		'ExcelStock': false,
		'ExcelAgora': false
	};
	var Done = {
		'ProductsResources': false,
		'ExcelResources': false,
		'ExcelAgora': false,
		'ExcelStock': false
	}

	function done(Key) {

		if(!Done[Key]) {

			Done[Key] = true;

			if(Debug) console.log('* loader_' + Key.toLowerCase() + '_ready');
			$rootScope.$broadcast('loader_' + Key.toLowerCase() + '_ready');
		}
	}

	function check() {

		/* ------------------------------------------------------------
			Loads */

		// ------------------------------
		// Products Resources

		if(
			Loaded['MaxUploadSize'] &&
			Loaded['ProductsCategories'] &&
			Loaded['FamiliesCategories'] &&
			Loaded['ColorSize'] &&
			Loaded['MaxUploadSize'] &&
			Loaded['Images'] &&
			Loaded['ProductsStock']
		) { done('ProductsResources'); }

		// ------------------------------
		// Agora Excel Resources

		if(
			Loaded['FieldsFootPrint'] &&
			Loaded['ParentSKU'] &&
			Loaded['ExcelStock']
		) { done('ExcelResources'); }

		/* ------------------------------------------------------------
			Dones */

		// ------------------------------
		// Agora excel & products
		
		if(
			Done['ProductsResources'] && 
			Done['ExcelResources']
		) { done('ProductsExcelResources'); }
	}

	Self.ready = function(Key) {

		if(Debug) console.log('Loaded ' + Key);
		$rootScope.$emit('notifydialog', { text: 'Loaded ' + Key });
		Loaded[Key] = true;
		check();
	}	

	return Self;
});
	