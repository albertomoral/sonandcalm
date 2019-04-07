/* excel.js */

APP.directive(
		'poeticsoftWooAgoraStock', 
	function() {

		function controller(
			$http,
			$q,
			$rootScope,
			$scope,
			$timeout,
			Products,
			Notifications,
			Stock,
			Loader
		) {
			
			$scope.AllowApply = false;
			$scope.DataChanged = false;
			$scope.StockChanged = true;

			var InventarioSheet;

			// Loader

			$scope.AgoraKendoUploadConfig = {
				multiple: false,
				async: {
					autoUpload: false
				},
				validation: {
					allowedExtensions: ['.xlsx'],
				},
        localization: {
            select: "Select EXCEL file"
        },
				select: function(e) {

					$scope.AllowApply = false;
					$scope.DataChanged = false;
					
					$scope.AgoraStockKendoSpreadsheet
					.fromFile(e.files[0].rawFile)
					.then(function() {

						$rootScope.$broadcast('opendialog', {
							Title: 'Stock process'
						});

						sheetLoaded(true)
						.then(function() {

							$scope.AllowApply = true;
							$scope.DataChanged = true;
	
							$rootScope.$emit('closedialog');
						});
					});
				}
			}

			function sheetLoaded() {

				var $Q = $q.defer();

				// There is a sheet "Inventario"

				$rootScope.$emit('notifydialog', { text: 'Searching Inventario sheet...' });

				InventarioSheet = $scope.AgoraStockKendoSpreadsheet.sheetByName('Inventario');
				if(!InventarioSheet) {							

					$scope.AgoraStockKendoSpreadsheet.sheets()
					.forEach(function(Sheet) {

						Sheet.range(kendo.spreadsheet.SHEETREF).clear()
					});
					
					$rootScope.$emit('closedialog');
					return Notifications.show({ errors: 'Load an Excel file with an "Inventario" sheet' });
				}	

				// Fields secuence validation

				$rootScope.$emit('notifydialog', { text: 'Validating sheet...' });

				RowCount = InventarioSheet._rows._count;				

				InventarioSheet.range(
					'A2:' + 
					Products.FootPrint.Stock.MaxCellIndex + 
					RowCount
				).sort(Products.FootPrint.Stock.SKUCellIndex);
						
				var FieldsRow = InventarioSheet.range(
					'A1:' + Products.FootPrint.Stock.MaxCellIndex + 1
				).values()[0];
				var FieldsFootPrint = FieldsRow.join('|');

				if(FieldsFootPrint == Products.FootPrint.Stock.Hash) {

					$rootScope.$emit('notifydialog', { text: 'Extracting data...' });

				} else {							

					$scope.AgoraStockKendoSpreadsheet.sheets()
					.forEach(function(Sheet) {

						Sheet.range(kendo.spreadsheet.SHEETREF).clear()
					});
			
					$rootScope.$emit('closedialog');
					return Notifications.show(
						{ 
							errors: 'Error, Products sheet doesn\'t have appropiate fields structure, get another file.'
						},
						true,
						4000
					);
				}

				//  Disable edit				

				Products.FootPrint.Stock.NoEdit.split('')
				.forEach(function(ColumnIndex) {

					var Range = ColumnIndex + '1:' + ColumnIndex + RowCount;
					InventarioSheet
					.range(Range)
					.enable(false)
					.background('transparent')
					.color('black');
				});

				// Extract data				

				$timeout(function() {				

					Stock.NewData = {};

					var Rows = InventarioSheet.toJSON().rows;
					Rows.shift(); // Extract field names

					Rows.forEach(function(Row) {

						var SKUCell = Row.cells.find(function(Cell) {

							return Cell.index == 4; // 'Código Barras';
						});

						if(!SKUCell) return;
						var SKU = $.trim(SKUCell.value).split(' ').join('').split(',').join('.');

						if(SKU == '') return;

						var StockCell = Row.cells.find(function(Cell) {

							return Cell.index == 5; // 5 > Stock Teórico (Uds. Venta) | 6 > Stock real;
						});

						if(!StockCell) return;

						Stock.NewData[SKU] = {
							Value: $.trim(StockCell.value),
							Index: Row.index + 1
						};
					});

					$rootScope.$emit('notifydialog', { text: 'Stock Data Ready' });

					$timeout(function() {

						$Q.resolve();

					}, 200);
				}, 200);

				return $Q.promise;
			}
		
			$scope.AgoraStockSpreadsheetConfig = {
				toolbar: {
					home: false,
					insert: false,
					data: false
				},
				excel: {
					fileName: 'WEB-AGORA-STOCK.xlsx'
				}
			};	

			// Apply stock to web products

			$scope.applyToWebProducts = function() {	
				
				$scope.AllowApply = false;

				$rootScope.$broadcast('opendialog', {
					Title: 'Apply stock'
				});
				$rootScope.$emit('notifydialog', { text: 'Updating web products' });

				$timeout(function() {

					var Data = {
						InventarioSheetData: InventarioSheet.toJSON()
					};		

					$rootScope.$emit('notifydialog', { text: 'Saving stock data' });			

					$http.post(
						'/wp-json/poeticsoft/woo-agora-excel-stock-update',
						Data
					)
					.then(function(Response) {

						var Code = Response.data.Status.Code;
						if(Code == 'OK'){
							
							$scope.AllowApply = true;
							$scope.DataChanged = false;

						} else {

							Notifications.show({ errors: Response.data.Status.Reason });
						}

						Products.updateStock();

						$rootScope.$emit('closedialog');
					});
				}, 200);			
			}					

			/* Load last excel saved */

			function loadData() {

				var $Q = $q.defer();

				$http.get('/wp-json/poeticsoft/woo-agora-excel-stock-read')
				.then(function(Response) {

					var Code = Response.data.Status.Code;
					if(Code == 'OK'){ 

						if(Response.data.Data.length == 0) {

							$rootScope.$emit('notifydialog', { text: 'No data' });

							return $timeout(function() {

								$rootScope.$emit('closedialog');
								
							}, 200);
						}

						var InventarioSheetData = Response.data.Data;
						delete InventarioSheetData.activeCell;
						delete InventarioSheetData.selection;

						$scope.AgoraStockKendoSpreadsheet.fromJSON({
							sheets: [InventarioSheetData]
						});				
						
						InventarioSheet = $scope.AgoraStockKendoSpreadsheet.activeSheet();
						RowCount = InventarioSheet._rows._count;

						$rootScope.$emit('notifydialog', { text: Response.data.Status.Message });

						$timeout(function() {

							sheetLoaded()
							.then(function() {

								$Q.resolve();
							});
							
						}, 200);

					} else {

						Notifications.show({ errors: Response.data.Status.Reason });

						$Q.resolve();
					}
				});

				return $Q.promise
			}

			$scope.download = function() {

				$scope.AgoraStockKendoSpreadsheet.saveAsExcel();
			}

			// Revert

			$scope.revert = function() {				
			
				$scope.AllowApply = false;			
				$scope.allowProcessing = false;

				$rootScope.$broadcast('opendialog', {
					Title: 'Loading stock data'
				});

				loadData()
				.then(function() {

					$rootScope.$broadcast('closedialog');									
			
					$scope.AllowApply = true;			
					$scope.allowProcessing = true;
				});
			}

			// Update new stock

			$scope.$on('updateexcelstock', function(Event, Data) {

				Data.forEach(function(Product) {

					var StockProduct = Stock.NewData[Product.sku];
					if(StockProduct) {

						var RowIndex = Stock.NewData[Product.sku].Index;
						var StockCell = InventarioSheet.range(Products.FootPrint.Stock.StockCellIndex + RowIndex);
						var ActualValue = StockCell.value();
						var ExportValue = Product.export_stock_quantity;

						if(ActualValue != ExportValue) {
						
							StockCell.value(ExportValue);
							StockCell.background('#e67959');
							StockCell.color('#ffffff');
						} else {
						
							StockCell.background('#71e659');
							StockCell.color('#ffffff');							
						}
					}
				});												
			
				$scope.AllowApply = true;			
			});

			// Load Agora Stock data
			
			$scope.$on("kendoWidgetCreated", function(event, widget){
      
        if (widget === $scope.AgoraStockKendoSpreadsheet) { 

					loadData()
					.then(function() {

						Loader.ready('ExcelStock');
					});
				}
			});
		}

		return {
			restrict: 'E',
			replace: true,
			scope: true,
			controller: controller,
			template: `<div class="poeticsoft-woo-agora-stock">
				<div class="SpreadsheetTools">
					<input kendo-upload="AgoraKendoUpload"
						     name="file"
						     type="file"
						     k-options="AgoraKendoUploadConfig"
					/>
					<div class="Actions">
						<button class="k-button"
										ng-click="applyToWebProducts()"
										ng-disabled="!AllowApply">
							Apply
						</button>
						<button class="k-button"
										ng-click="revertData()"
										ng-disabled="!DataChanged">
							Revert
						</button>
						<button class="k-button"
										ng-click="download()"
										ng-disabled="!StockChanged">
							Download
						</button>
					</div>
				</div>
				<div class="SpreadsheetView">
					<div kendo-spreadsheet="AgoraStockKendoSpreadsheet"
							 k-options="AgoraStockSpreadsheetConfig">
					</div>
				</div>
			</div>`
		};
	});