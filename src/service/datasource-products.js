/* datasource-products.js */

APP.factory(
	'Products',
function (
	$http,
	$q, 
	$timeout,
	$rootScope,
	Stock,
	Notifications,
	Loader
) {

	var Self = {};

	/* -------------------------------------------------------------------------
		 Local data for process 
	*/

	Self.WebData = {}; 		// Products loaded from web
	Self.AgoraData = {}; 	// Products from agora export 
	Self.TempData = {};		// Process buffer

	/* -------------------------------------------------------------------------
		 Calculate changes betweeen web data and actual agora data + stock 
	*/

	var PlainCompares = [
		'parent_sku',
		'type',
		'name',
		'image_id',
		'sale_price'
	]

	var ArrayCompares = [
		'category_ids',
		'gallery_image_ids'
	]

	function calculateChanges(SKU) {

		/*
		console.log(Self.WebData[SKU]); 
		console.log(Self.AgoraData[SKU]);
		*/

		/* Changes array */

		Self.TempData[SKU].changes = [];

		/* Plain */

		PlainCompares.forEach(function(Field) {

			if(
				Self.WebData[SKU][Field] != 
				Self.AgoraData[SKU][Field]
			) {

				Self.TempData[SKU][Field] = Self.AgoraData[SKU][Field];
				Self.TempData[SKU].status = 'changed';
				Self.TempData[SKU].changes.push(Field);
			}
		});

		/* Arrays */

		ArrayCompares.forEach(function(Field) {

			var WebArray = [].concat(Self.WebData[SKU][Field]).sort().join();
			var AgoraArray = [].concat(Self.AgoraData[SKU][Field]).sort().join();

			if(WebArray != AgoraArray) {

				Self.TempData[SKU][Field] = Self.AgoraData[SKU][Field];
				Self.TempData[SKU].status = 'changed';
				Self.TempData[SKU].changes.push(Field);
			}
		});

		/* Attributes */

		var WebColor = Self.WebData[SKU].attributes.color.split('|').sort().join('|');
		var AgoraColor = Self.AgoraData[SKU].attributes.color.split('|').sort().join('|');

		if(WebColor != AgoraColor) {

			Self.TempData[SKU].attributes.color = AgoraColor;
			Self.TempData[SKU].status = 'changed';
			Self.TempData[SKU].changes.push('color');
		}		

		var WebSize = Self.WebData[SKU].attributes.size.split('|').sort().join('|');
		var AgoraSize = Self.AgoraData[SKU].attributes.size.split('|').sort().join('|');

		if(WebSize !=  AgoraSize) {

			Self.TempData[SKU].attributes.size = AgoraSize;
			Self.TempData[SKU].status = 'changed';
			Self.TempData[SKU].changes.push('size');
		}

		/* Stock */

		calculateStock(SKU);
	}	

	/* -------------------------------------------------------------------------
		 Update process buffer with data from agora excel 
	*/

	Self.updateFromAgora = function() {

		Self.TempData = {};

		/* Mark as removed web product if not in Agora */

		Object.keys(Self.WebData)
		.forEach(function(SKU) {

			Self.TempData[SKU] = Self.WebData[SKU];
			if(!Self.AgoraData[SKU]) { Self.TempData[SKU].status = 'deleted';  }
		});

		Object.keys(Self.AgoraData)
		.forEach(function(SKU) {

			Self.TempData[SKU] = Self.AgoraData[SKU];
			Self.TempData[SKU].status = 'updated';

			/* Mark as new if not in web */

			if(!Self.WebData[SKU]) { Self.TempData[SKU].status = 'new'; }				

			/* Update if changed */

			else { calculateChanges(SKU); }

			/* Save stock as in web */
		});

		/* visualize result */

		visualize();
	}

	/* -------------------------------------------------------------------------
		Converts TempData in an array for consuming in Kendo Grid
	*/

	function visualize() {

		var VisualizeData = [];

		Object.keys(Self.TempData)
		.forEach(function(SKU) {

			VisualizeData.push(Self.TempData[SKU]);
		});		

		VisualizeData.sort(function(a, b) {

			if (a.sku < b.sku) { return -1; }
			if (a.sku > b.sku) { return 1; };
			return 0;
		});

		Self.DS.read({ data: VisualizeData });

		$rootScope.$broadcast('productschanged');
	}			

	/* -------------------------------------------------------------------------
		Data structure for kendo grid
	*/

	Self.DS = new kendo.data.TreeListDataSource ({
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
					/* Calculated from Excel */
					'sku': { type: 'string', editable: false },
					'parent_sku': { type: 'string', editable: false, nullable: true },
					'type': { type: 'string', editable: false },
					'name': { type: 'string', editable: false },
					'category_ids': [],	
					'sale_price': { type: 'number', editable: false },
					/* Calculated from ColorSize */
					'attributes': {
						'color': '',
						'size': ''
					},
					/* Calculated from Images */
					'image_id': { type: 'number', editable: false },
					'gallery_image_ids': [],
					/* Calculated from Stock */	
					'stock_quantity': { type: 'number', editable: false },
					/* Mark */	
					'status': { type: 'string', editable: false } // 'updated', 'deleted', 'new', 'changed'
				},
				expanded: true
			}
		},
		sort: { 
			field: 'sku', 
			dir: 'asc' 
		}
	});

	/* -------------------------------------------------------------------------
		Load Web Products Data
	*/

	Self.loadFromWeb = function() {

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
				Self.AgoraData = {};
				Self.TempData = {};

				Response.data.Data.forEach(function(Product) {

					Product.status = 'updated';
					Product.parent_sku = Product.parent_sku || null; // Tree View
					Self.WebData[Product.sku] = Product;
				});

										
				Self.AgoraData = JSON.parse(JSON.stringify(Self.WebData));						
				Self.TempData = JSON.parse(JSON.stringify(Self.WebData));

				Self.updateStock();

				visualize();
			}
		);

		return $Q.promise;
	}

	/* -------------------------------------------------------------------------
		Save conversion to web and update woo products
	*/

	var ProcessFragments = [
		'deleted_variation',	
		'deleted_variable',
		'deleted_simple',
		'new_simple',
		'new_variable',
		'new_variation',
		'changed_simple',
		'changed_variable',
		'changed_variation'	
	];

	Self.saveToWeb = function() {

		var $Q = $q.defer();

		/* Same as Self.TempData but may be in a future grid will be editable */

		var ProductsData = Self.DS.data().toJSON();		
        
		/* Stock excel update */

		$rootScope.$broadcast('updateexcelstock', ProductsData);
		
		/* Generate queue */

		var Queue = [];

		ProcessFragments 
		.forEach(function(Key) {

			var Code = Key.split('_');
			var Status = Code[0];
			var Type = Code[1];
			var ProductList = ProductsData.filter(function(Product) {

				return Product.status == Status &&
							 Product.type == Type;
			});			
			var ProductsListChunks = _.chunk(ProductList, 20);
			var ChunkCount = ProductsListChunks.length;

			ProductsListChunks
			.forEach(function(Chunk, Index) {

				Queue.push({
					mode: Key,
					products: Chunk,
					chunk: Index + 1,
					count: ChunkCount
				});
			});
		});

		function processQueue() {

			if(Queue.length == 0) {	

				$rootScope.$emit('notifydialog', { text: 'Queue finished' });

				return $timeout(function() {
					
					$Q.resolve();
				}, 200);
			}

			var Chunk = Queue.shift();

			$http.post(
				'/wp-json/poeticsoft/woo-products-process',
				Chunk
			)
			.then(function(Response) {
			
				if(Response.data.Status.Code == 'KO') {	

					Notifications.show({ errors: Response.data.Status.Reason });	
				}
				
				$rootScope.$emit('notifydialog', { text: Response.data.Status.Message }); 

				$timeout(processQueue, 10);
			});
		}

		if(Queue.length > 0) {
			
			processQueue();

		}	else {
			
			$rootScope.$emit('notifydialog', { text: 'Nothing to update...' });

			$timeout(function() {
				
				$Q.resolve();
			}, 200);
		}

		return $Q.promise;
	}

	/* -------------------------------------------------------------------------
		Update stock in actual products
	*/	

	function calculateStock(SKU) {				

		if(Self.TempData[SKU].type == 'variable') {

			Self.TempData[SKU].stock_quantity = '';
			Self.TempData[SKU].last_stock_quantity = '';
			Self.TempData[SKU].actual_stock_quantity = '';
			Self.TempData[SKU].export_stock_quantity = '';
			
		} else {

			var StockQuantity = Self.WebData[SKU] ? Self.WebData[SKU].stock_quantity : null;

			Self.TempData[SKU].stock_quantity = StockQuantity;
			Self.TempData[SKU].last_stock_quantity = (Stock.OldData[SKU] && Stock.OldData[SKU].Value) || '-';
			Self.TempData[SKU].actual_stock_quantity = (Stock.NewData[SKU] && Stock.NewData[SKU].Value) || '-';
			Self.TempData[SKU].export_stock_quantity = Self.TempData[SKU].stock_quantity ?
																										Self.TempData[SKU].actual_stock_quantity - 
																										(
																												Self.TempData[SKU].last_stock_quantity - 
																												Self.TempData[SKU].stock_quantity
																										) 
																										:
																										Self.TempData[SKU].actual_stock_quantity;
		}		

		if(Self.TempData[SKU].stock_quantity != Self.TempData[SKU].export_stock_quantity) {
				
			Self.TempData[SKU].status = 'changed';
			Self.TempData[SKU].changes = Self.TempData[SKU].changes || [];
			Self.TempData[SKU].changes.push('stock');
		}
	}

	Self.updateStock = function() {

		var $Q = $q.defer();
				
		Object.keys(Self.TempData)
		.forEach(function(Key) {

			calculateStock(Key);
		});

		$Q.resolve();

		return $Q.promise;
	}

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

			Loader.ready('FieldsFootPrint');
		}
	);

	/* Load last products processed data when resources ready */
	
	$rootScope.$on('loader_productsexcelresources_ready', function() {

		Self.loadFromWeb();
	});

	return Self;
});