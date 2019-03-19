/* datasource-products.js */

APP.factory(
	'Products',
function (
	$http,
	$q, 
	$rootScope, 
	$timeout, 
	Notifications
) {

	var Self = {};

	/* Local data for process */

	Self.WebData = {};
	Self.NewData = {};
	Self.TempData = {};

	function mergeData(SKU) {
		
		return false;
	}

	Self.processDifferences = function() {

		Self.TempData = {};

		/* Mark as removed web product if not in Agora */

		Object.keys(Self.WebData)
		.forEach(function(SKU) {

			Self.TempData[SKU] = Self.WebData[SKU];
			if(!Self.NewData[SKU]) { Self.TempData[SKU].status = 'deleted';  }
		});

		Object.keys(Self.NewData)
		.forEach(function(SKU) {

			Self.TempData[SKU] = Self.NewData[SKU];
			Self.TempData[SKU].status = 'updated';			

			/* Mark as new if not in web */

			if(!Self.WebData[SKU]) { Self.TempData[SKU].status = 'new'; }				

			/* Mark as changed if is in web but different */

			else { if(mergeData(SKU)){ Self.TempData[SKU].status = 'changed'; } }

		});

		/* visualize result */

		var TempData = [];
		Object.keys(Self.TempData)
		.forEach(function(SKU) {

			TempData.push(Self.TempData[SKU]);
		});

		Self.DS.read({ data: TempData });
	}

	/* Data structure for visualization */

	Self.DS = new kendo.data.TreeListDataSource ({
		// page: 1,
		// pageSize: 20,
		transport: {
			read: function(Op) {

				Op.success(Op.data.data);
			}
		},
		schema: {
			model: {
				id: 'sku',
				parentId: 'parent_sku',
				fields: {
					'sku': { type: 'string', editable: false },
					'parent_sku': { type: 'string', editable: false, nullable: true },
					'type': { type: 'string', editable: false },
					'name': { type: 'string', editable: false, expanded: false },
					'category_ids': [],
					'image_id': { type: 'number', editable: false },
					'price': { type: 'number', editable: false },
					'sale_price': { type: 'number', editable: false },
					'stock_quantity': { type: 'number', editable: false },
					'status': { type: 'string', editable: false } // 'updated', 'deleted', 'new', 'changed'
				},
				expanded: true
			}
		}
	});

	/* Load Web Products Data */

	Self.loadWebProducts = function() {

		var $Q = $q.defer();

		$http
		.get('/wp-json/poeticsoft/woo-products-read')
		.then(
			function(Response) {

				$Q.resolve();

				if(Response.data.Status.Code == 'KO') {						
			
					$rootScope.$emit('closedialog');
					return Notifications.show({ errors: Response.data.Status.Reason });
				}			

				Self.WebData = {};
				Response.data.Data.forEach(function(Product) {

					Product.status = 'updated';
					Self.WebData[Product.sku] = Product;
				});

				/* Visuaize */

				Self.DS.read({ data: Response.data.Data });
			}
		);

		return $Q.promise;
	}
	Self.loadWebProducts();

	/* Load Excel FootPrint */

	Self.FootPrint = [];
	$http
	.get('/wp-json/poeticsoft/get-agora-fields-footprint')
	.then(
		function(Response) {

			if(Response.data.Status.Code == 'KO') {						
		
				$rootScope.$emit('closedialog');
				return Notifications.show({ errors: Response.data.Status.Reason });
			}

			Self.FootPrint = Response.data.Data;
		}
	);	

	return Self;
});