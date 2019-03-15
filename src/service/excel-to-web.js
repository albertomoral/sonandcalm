/* excel-to-web.js */

APP.factory(
	'ExcelToWeb', 
function (
		$rootScope,
		$q, 
		$timeout, 
		Products,
		Categories,
		Images
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

		/* calculate Type & Images & Categories*/
		
		ProductRows.forEach(function(ProductRow, Index) {

			if(ProductRow.Vars == 0) {

				ProductRow.Type = 'variation';

			} else {

				if(ProductRow.Vars == 1) {

					ProductRow.Type = 'simple';

				} else {

					ProductRow.Type = 'variable';
				}
			}

			ProductRow.Images = Images.Group[ProductRow['Código Barras']] ? true : false;

			ProductRow.Categories = Categories.FamilyCategories[ProductRow.Familia] || [];
		});

		return ProductRows;
	}

	function formatProduct(Product) {

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

		return {
			id: Product['Código Barras'],
			parent_id: Product.Parent == Product['Código Barras'] ? 0 : Product.Parent,
			sku: Product['Código Barras'],
			parent_sku: Product.Parent == Product['Código Barras'] ? 0 : Product.Parent,
			type: Product.Type,
			name: Product.Producto,
			category_ids: Product.Categories,
			image_id: '',
			sale_price: Product['Precio General'],
			stock_quantity: 0
		};
	}

	/* Processs user interaction */

	Self.process = function(RowsRange) {

		var $Q = $q.defer();
		
		$rootScope.$broadcast('opendialog', {
			Title: 'Excel to Web Products',
			CanCancel: true
		});
		$rootScope.$emit('notifydialog', { text: 'Converting Excel format and calculating type, images & categories' });

		$timeout(function() {

			var ProductsData = digestRange(RowsRange);	

			$rootScope.$emit('notifydialog', { text: 'Updating web products list' });

			$timeout(function() {	

				Products.DS.read({ data: ProductsData.map(formatProduct) });
				
				$rootScope.$emit('notifydialog', { text: 'Web products list updated, go to Web > Products' });

				$timeout(function() {	

					$rootScope.$emit('closedialog');
					$Q.resolve();

				}, 2000);

			}, 200);

		}, 200);

		return $Q.promise;
	};

  return Self;
});