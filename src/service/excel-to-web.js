/* excel-to-web.js */

APP.factory(
	'ExcelToWeb', 
function (
		$rootScope,
		$q, 
		$timeout, 
		Products,
		Categories,
		Images,
		ColorSize
) {
	
	var Self = {};

	/* Excel rows to Product Array + Categories & SKU Code Base */

	function digestRange(RowsRange) {

		var Families = {};
		var ProductRows = [];

		/* Rows struct to array of row objects */

		RowsRange.forEachRow(function(R, Index) {

			var Row = {};

			R.forEachCell(function (row, column, value) {

				Row[Products.FootPrint.FinalFields[column]] = value.value;
			});

			var SKU = $.trim(Row['Código Barras']);
			if(SKU) {

				if(Row.Familia) { Families[Row.Familia] = '';	} // Dummy for unique values
				ProductRows.push(Row);
			} 
		});

		/* order based in parent */

		ProductRows.sort(function(a, b) {

			if (a.Parent < b.Parent) { return -1; }
			if (a.Parent > b.Parent) { return 1; };
			return 0;
		});
		
		/* Categories based in family mapping */

		Categories.updateFamilies(Object.keys(Families));

		/* Variations count */

		var FirstVariationIndex = 0;
		var Parent = '';
		var ParentId = 0;
		var VarCount = 0;

		ProductRows.forEach(function(ProductRow, Index) {

			ProductRow.Vars = 0;

			if(ProductRow.Parent != Parent) {

				ProductRows[FirstVariationIndex].Vars = VarCount;

				VarCount = 0;
				FirstVariationIndex = Index;
				Parent = ProductRow.Parent;
			}

			VarCount++;
		});

		/* Calculate Type & Variations, Images, Categories*/
		
		ProductRows.forEach(function(ProductRow, Index) {

			if(ProductRow.Vars == 0) {

				ProductRow.Type = 'variation';
				ProductRow.Attributes = {
					attribute_color: '',
					attribute_size: ''
				}

			} else {

				if(ProductRow.Vars == 1) {

					ProductRow.Type = 'simple';

				} else {

					ProductRow.Type = 'variable';
					ProductRow.Attributes = {
						color: {},
						size: {}
					}
				}
			}

			ProductRow.Images = Images.Group[ProductRow['Código Barras']] ? true : false;
			ProductRow.Categories = Categories.FamilyCategories[ProductRow.Familia] || [];
		});

		return ProductRows;
	}

	/*
	% Impuesto: "Sí"
	% Impuesto compra: "No"
	Categories: (4) [34, 48, 35, 23]
	Color: 190
	Control Stock: "#BACDE2"
	Código Barras: "01.BLAN.BAKU.CHAR.250"
	Familia: "BLANKET"
	Images: false
	PLU: 21
	Parent: "01.BLAN.BAKU.CHAR.250"
	Precio Coste: 21
	Precio General: "160x250"
	Producto: "BLANKET BAKUGA CHARCOAL 250CM"
	Size: 73
	Type: "variable"
	Vars: 4
	Venta Peso: "BLANKET BAKUGA CHARCOAL 250CM"
	texto Boton: "GRIS OSCURO"
	*/

	function compareCategories(RemoteProductCategories, ProductCategories) {

		var RC = [].concat(RemoteProductCategories).sort().join();
		var PC = [].concat(ProductCategories).sort().join();
		return RC != PC;
	}

	function somethingChanged(RemoteProduct, Product) {

		return compareCategories(RemoteProduct.category_ids, Product.Categories) ||
					 RemoteProduct
	}

	function mergeProductData() {

		var SKU = Product['Código Barras'];
		var RemoteProduct = Products.RemoteData[SKU];
		var Status = 'updated';
		if(!RemoteProduct) { Status = 'new'; }
		if(somethingChanged(RemoteProduct, Product)) {

			Status = 'changed';
		}
	}

	function formatProduct(Product) {

		var SKU = Product['Código Barras'];

		return {

			/* Calculated from Excel */
			sku: SKU,
			parent_sku: Product.Parent == SKU ? null : Product.Parent,
			type: Product.Type,
			name: Product.Producto,
			category_ids: Product.Categories,
			sale_price: Product['Precio General'],

			/* Calculated from ColorSize */
			attributes: {
					attribute_color: ColorSize.Data[SKU] && ColorSize.Data[SKU].color || null,
					attribute_size: ColorSize.Data[SKU] && ColorSize.Data[SKU].size || null
			},
			
			/* Calculated from Images */
			image_id: Images.Group[SKU] && Images.Group[SKU].items[0].attid,
			gallery_image_ids: [],
			variation_gallery_images: [],			
			
			/* Calculated from Stock */
			stock_quantity: 0
		};
	}

	/* Processs on user interaction */

	var NewProductsData = {};

	Self.process = function(RowsRange) {

		var $Q = $q.defer();
		
		NewProductsData = {};
		
		$rootScope.$broadcast('opendialog', {
			Title: 'Excel to Web Products',
			CanCancel: true
		});
		$rootScope.$emit('notifydialog', { text: 'Converting Excel format and calculating type, images & categories' });

		$timeout(function() {

			// Sort, Calculate Parent, Categories, Color, Size, Type, Variations ...
			digestRange(RowsRange)
			// Translate to WooCommerce struct
			.map(formatProduct)
			// Save list
			.forEach(function(Product) {

				NewProductsData[Product.sku] = Product;
			});
			
			console.log(NewProductsData);

			$rootScope.$emit('closedialog');
			$Q.resolve();

			/*

			$rootScope.$emit('notifydialog', { text: 'Updating web products list' });

			$timeout(function() {	

				var NewProductsStatus = ProductsData.map(formatProduct);

				// Products.DS.read({ data: ProductsMapped });
				
				$rootScope.$emit('notifydialog', { text: 'Web products list updated, go to Web > Products' });

				$timeout(function() {	

					$rootScope.$emit('closedialog');
					$Q.resolve();

				}, 1000);

			}, 200);

			*/

		}, 200);

		return $Q.promise;
	};

  return Self;
});