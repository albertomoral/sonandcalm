/* datasource-sku-parent.js */

APP.factory(
	'Loader', 
function (
	$rootScope
) {

	var Self = {};
	var Debug = true;
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
		) {

			if(!Done['ProductsResources']) {

				Done['ProductsResources'] = true;

				if(Debug) console.log('* loader_productsresources_ready');

				$rootScope.$broadcast('loader_productsresources_ready');
				// Load products from web
			}
		}

		// ------------------------------
		// Agora Excel Resources

		if(
			Loaded['FieldsFootPrint'] &&
			Loaded['ParentSKU']
		) {

			if(!Done['ExcelResources']) {

				Done['ExcelResources'] = true;

				if(Debug) console.log('* loader_excelresources_ready');

				$rootScope.$broadcast('loader_excelresources_ready');
				// Load agora Excel
			}
		}

		/* ------------------------------------------------------------
			Dones */

		// ------------------------------
		// Agora excel & products
		
		if(
			Done['ProductsResources'] && 
			Done['ExcelResources']
		) {

			if(!Done['ProductsExcel']) {

				Done['ProductsExcel'] = true;

				if(Debug) console.log('> loader_products_excel_ready');
	
				$rootScope.$broadcast('loader_products_excel_ready');
			}
		}
	}

	Self.ready = function(Key) {

		if(Debug) console.log('Loaded' + Key);

		$rootScope.$emit('notifydialog', { text: 'Loaded ' + Key });

		Loaded[Key] = true;
		check();
	}	

	return Self;
});
	