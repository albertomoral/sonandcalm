/* datasource-products.js */

APP.factory(
	'Products',
function (
	$http,
	$q, 
	$timeout,
	$rootScope,
	Stock,
	Notifications
) {

	var Self = {};

	/* Local data for process */

	Self.WebData = {}; 		// Products loaded from web
	Self.AgoraData = {}; 	// Products from agora export 
	Self.TempData = {};		// Process buffer

	var PlainCompares = [
		'parent_sku',
		'type',
		'name',
		'image_id',
		'sale_price',
		'stock_quantity'
	]

	var ArrayCompares = [
		'category_ids',
		'gallery_image_ids',
		'variation_gallery_images'
	]

	function updateData(SKU) {

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

			if(
				[].concat(Self.WebData[SKU][Field]).sort().join() != 
				[].concat(Self.AgoraData[SKU][Field]).sort().join()
			) {

				Self.TempData[SKU][Field] = Self.AgoraData[SKU][Field];
				Self.TempData[SKU].status = 'changed';
				Self.TempData[SKU].changes.push(Field);
			}
		});

		/* Attributes */

		if(
			Self.WebData[SKU].attributes.color != 
			Self.AgoraData[SKU].attributes.color
		) {

			Self.TempData[SKU].attributes.color = Self.AgoraData[SKU].attributes.color;
			Self.TempData[SKU].status = 'changed';
			Self.TempData[SKU].changes.push('color');
		}		

		if(
			Self.WebData[SKU].attributes.size != 
			Self.AgoraData[SKU].attributes.size
		) {

			Self.TempData[SKU].attributes.size = Self.AgoraData[SKU].attributes.size;
			Self.TempData[SKU].status = 'changed';
			Self.TempData[SKU].changes.push('size');
		}
	}

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

			else { updateData(SKU); }

		});

		/* visualize result */

		visualize();
	}

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

	/* Data structure for visualization */

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
					'variation_gallery_images': [],	
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

	/* Load Web Products Data */

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
					Self.AgoraData[Product.sku] = Product;							
					Self.TempData[Product.sku] = Product;		
				});

				/* Visualize */

				visualize();
			}
		);

		return $Q.promise;
	}

	/* Save conversion to web and update woo products */

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

		/* same as Self.TempData but may be in a future grid will be editable */

		var ProductsData = Self.DS.data().toJSON();
		
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

				return $Q.resolve();
			}

			var Chunk = Queue.shift();

			$http.post(
				'/wp-json/poeticsoft/woo-products-process',
				Chunk
			)
			.then(function(Response) {
			
				if(Response.data.Status.Code == 'KO') {						

					$Q.resolve();				

					return Notifications.show({ errors: Response.data.Status.Reason });	
				}
				
				$rootScope.$emit('notifydialog', { text: Response.data.Status.Message }); 

				$timeout(processQueue, 10);
			});
		}

		processQueue();		

		return $Q.promise;
	}

	/* Update stock in actual products */

	Self.updateStock = function() {

		var $Q = $q.defer();
				
		Object.keys(Self.TempData)
		.forEach(function(Key) {

			if(Stock.Data[Key]) {				

				Self.TempData[Key].new_stock = Stock.Data[Key].Value;
			}
		})

		visualize();

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
		}
	);

	/* Load last products processed data */
	
	Self.loadFromWeb();

	return Self;
});