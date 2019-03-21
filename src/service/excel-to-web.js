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
		var Color = {};
		var Size = {};

		ProductRows.forEach(function(ProductRow, Index) {

			var SKU = ProductRow['Código Barras'];

			ProductRow.Vars = 0;

			if(ProductRow.Parent != Parent) {

				ProductRows[FirstVariationIndex].Vars = VarCount;
				ProductRows[FirstVariationIndex].Color = Object.keys(Color);
				ProductRows[FirstVariationIndex].Size = Object.keys(Size);

				VarCount = 0;
				Color = [];
				Size = [];

				FirstVariationIndex = Index;
				Parent = ProductRow.Parent;
			}	

			ColorSize.Data[SKU] && ColorSize.Data[SKU].color && (Color[ColorSize.Data[SKU].color] = '');
			ColorSize.Data[SKU] && ColorSize.Data[SKU].size && (Size[ColorSize.Data[SKU].size] = '');
			VarCount++;
		});

		/* Calculate Type & Variations, Images, Categories*/
		
		ProductRows.forEach(function(ProductRow, Index) {

			var SKU = ProductRow['Código Barras'];

			if(ProductRow.Vars == 0) {

				ProductRow.Type = 'variation';
				ProductRow.Attributes = {
					attribute_color: ColorSize.Data[SKU] && ColorSize.Data[SKU].color,
					attribute_size: ColorSize.Data[SKU] && ColorSize.Data[SKU].size
				}

			} else {

				if(ProductRow.Vars == 1) {

					ProductRow.Type = 'simple';
					ProductRow.Attributes = {
						attribute_color: ColorSize.Data[SKU] && ColorSize.Data[SKU].color,
						attribute_size: ColorSize.Data[SKU] && ColorSize.Data[SKU].size
					}

				} else {

					ProductRow.Type = 'variable';
					ProductRow.Attributes = {
						color: ProductRow.Color ,
						size: ProductRow.Size
					}
				}
			}

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

	function formatProduct(Product) {

		var SKU = Product['Código Barras'];
		var ProductImages = Images.Group[SKU] && 
												Images.Group[SKU].items &&
												Images.Group[SKU].items.map(function(Image) {

													return Image.attid;
												});
		var ImageId;
		var GalleryImageIds;
		var VariationGalleryImages;

		switch(Product.Type) {

			case 'simple':
			case 'variable':

				ImageId = ProductImages && 
									(ProductImages.length > 0 ) && 
									ProductImages.shift();
				GalleryImageIds = ProductImages && 
												 (ProductImages.length > 0 ) &&
													ProductImages;
				break;

			case 'variation':

				VariationGalleryImages = ProductImages && 
																(ProductImages.length > 0 ) &&
																 ProductImages;
				break;
		}

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
				attribute_color: ColorSize.Data[SKU] && ColorSize.Data[SKU].color || '',
				attribute_size: ColorSize.Data[SKU] && ColorSize.Data[SKU].size || ''
			},			
			/* Calculated from Images */
			image_id: ImageId,
			gallery_image_ids: GalleryImageIds,
			variation_gallery_images: VariationGalleryImages,				
			/* Calculated from Stock */
			stock_quantity: 0
		};
	}

	/* Processs on user interaction */

	var NewProductsData = {};

	Self.process = function(RowsRange) {

		var $Q = $q.defer();

		Products.NewData = {}; 
		
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

				Products.NewData[Product.sku] = Product;
			});
		
			$rootScope.$emit('notifydialog', { text: 'Calculating differences with web status' });

			$timeout(function() {

				Products.processDifferences();

				$rootScope.$broadcast('closedialog');

				$Q.resolve();
				
			}, 200);
		}, 200);

		return $Q.promise;
	};

  return Self;
});