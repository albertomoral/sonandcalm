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

	/* Excel rows to Product List Struct */

	function digestRange(RowsRange) {

		var Families = {};
		var ProductRows = [];

		/* Rows to array of row objects */

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
		
		/* Categories based in family mapping */

		Categories.updateFamilies(Object.keys(Families));

		/* order based in parent to calculate variations */

		ProductRows.sort(function(a, b) {

			if (a.Parent < b.Parent) { return -1; }
			if (a.Parent > b.Parent) { return 1; };
			return 0;
		});

		/* Calculate Variations */

		var FirstVariationIndex = 0;
		var Parent = '';
		var VarCount = 0;
		var Color = {};
		var Size = {};
		var Names = [];

		ProductRows.forEach(function(ProductRow, Index) {

			var SKU = ProductRow['Código Barras']; 
			var Code = SKU.split('.');
					
			ProductRow.SKUParent = Code[0] + '.' + Code[1] + '.' + Code[2];
			ProductRow.Type = 'variation';

			if(ProductRow.Parent != Parent) {

				// Variable > +Name > + Attributes

				if(VarCount > 1) {
					var Name = _.intersection(...Names)
											.filter(function(Part) {

												return Part != 'CM' ||
																			 'M' ||
																			 'PERFIL' || 
																			 'SEDA+' || 
																			 'ALGODON+BAMBU' ||
																			 'cm'
											})
											.map(function(Word) {

												return _.upperFirst(Word.toLowerCase());
											})
											.join(' ');

					ProductRows[FirstVariationIndex].Type = 'variable'; 
					ProductRows[FirstVariationIndex].Name = Name;

				} else if(VarCount == 1) { 

					ProductRows[FirstVariationIndex].Type = 'simple'; 
				}

				ProductRows[FirstVariationIndex].Variations = {
					Color: Object.keys(Color),
					Size: Object.keys(Size)
				};

				/* Initializa accumulators */

				VarCount = 0;
				Color = [];
				Size = [];
				FirstVariationIndex = Index;
				Parent = ProductRow.Parent;
				Names = [];

			}	

			/* Accumulate names */

			Names.push(ProductRow.Producto.split(' '));

			/* Accumulate variations */

			VarCount++;

			ColorSize.Data[SKU] && ColorSize.Data[SKU].color && (Color[ColorSize.Data[SKU].color] = '');
			ColorSize.Data[SKU] && ColorSize.Data[SKU].size && (Size[ColorSize.Data[SKU].size] = '');
			
			/* Attributes */

			ProductRow.Attributes = {
				Color: ColorSize.Data[SKU] && ColorSize.Data[SKU].color || '',
				Size: ColorSize.Data[SKU] && ColorSize.Data[SKU].size || ''
			};

			/* Categories */

			ProductRow.Categories = Categories.FamilyCategories[ProductRow.Familia] || [];

			/* Images */					
		
			var ImageId;
			var GalleryImageIds;
			var VariationGalleryImages;
			var ProductImages = Images.Group[SKU] && 
				Images.Group[SKU].items &&
				Images.Group[SKU].items.map(function(Image) {

				return Image.attid;
			});

			switch(ProductRow.Type) {

				case 'simple':
				case 'variable':

					ProductRow.ImageId = ProductImages && 
															(ProductImages.length > 0 ) && 
															ProductImages.shift();

					ProductRow.GalleryImageIds = ProductImages && 
																			(ProductImages.length > 0 ) &&
																			 ProductImages;
					break;

				case 'variation':

					ProductRow.VariationGalleryImages = ProductImages && 
																						 (ProductImages.length > 0 ) &&
																							ProductImages;
					break;
			}
		});

		return ProductRows;
	}

	/* Excel data -------------------------------
	% Impuesto: "Sí"
	% Impuesto compra: "No"
	Attributes: {Color: "GRIS OSCURO", Size: "160x250"}
	Categories: (4) [34, 48, 35, 23]
	Color: 190
	Control Stock: "#BACDE2"
	Código Barras: "01.BLAN.BAKU.CHAR.250"
	Familia: "BLANKET"
	Name: "Blanket Bakuga"
	PLU: 21
	Parent: "01.BLAN.BAKU.CHAR.250"
	Precio Coste: 21
	Precio General: "160x250"
	Producto: "BLANKET BAKUGA CHARCOAL 250CM"
	SKUParent: "01.BLAN.BAKU"
	Size: 73
	Type: "variable"
	VariationGalleryImages: ["49959"]
	Variations: {Color: Array(4), Size: Array(2)}
	Venta Peso: "BLANKET BAKUGA CHARCOAL 250CM"
	texto Boton: "GRIS OSCURO"
	*/

	function formatProduct(Product) {

		var SKU = Product['Código Barras'];

		return {
			/* Calculated from Excel */
			sku: SKU,
			parent_code: Product.SKUParent,
			parent_sku: Product.Parent == SKU ? null : Product.Parent,
			type: Product.Type,
			name: Product.Producto,
			category_ids: Product.Categories,
			sale_price: Product['Precio General'],
			/* Calculated from ColorSize */
			attributes: {
				attribute_color: Product.Attributes.Color,
				attribute_size: Product.Attributes.Size
			},	
			variations: Product.Variations,
			/* Calculated from Images */
			image_id: Product.ImageId,
			gallery_image_ids: Product.GalleryImageIds,
			variation_gallery_images: Product.VariationGalleryImages,				
			/* Calculated from Stock */
			stock_quantity: 1
		};
	}

	/* Processs on user interaction */

	Self.processExcelData = function(RowsRange) {

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
			// Save list in service
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