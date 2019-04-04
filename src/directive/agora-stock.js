/* excel.js */

APP.directive(
		'poeticsoftWooAgoraStock', 
	function() {

		function controller(
			$http,
			$rootScope,
			$scope,
			$timeout,
			Products,
			Notifications,
			Stock
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
					
					$scope.AgoraStockKendoSpreadsheet
					.fromFile(e.files[0].rawFile)
					.then(function() {
						
						sheetLoaded(true);
					});
				}
			}

			function sheetLoaded() {

				$rootScope.$broadcast('opendialog', {
					Title: 'Stock process'
				});

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
					InventarioSheet.range(Range).enable(false)
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
							Value: $.trim(StockCell.value)
						};
					});

					$rootScope.$emit('notifydialog', { text: 'Data Ready' });

					$timeout(function() {

						$scope.AllowApply = true;
						$scope.DataChanged = true;
						
						Stock.NewReady = true;
						$rootScope.$broadcast('stockready');

						$rootScope.$emit('closedialog');

					}, 200);
				}, 200);
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

					Products.updateStock()
					.then(function() {

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

							$rootScope.$emit('closedialog');
						});
					})
				}, 200);			
			}					

			/* Load last excel saved */

			$scope.loadData = function() {
			
				$scope.AllowApply = false;

				$rootScope.$broadcast('opendialog', {
					Title: 'Loading stock data'
				});
			
				$scope.allowProcessing = false;

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

							$rootScope.$emit('closedialog');

							sheetLoaded();
							
						}, 200);

					} else {

						Notifications.show({ errors: Response.data.Status.Reason });
					}
				});
			}

			$scope.download = function() {

				$scope.AgoraStockKendoSpreadsheet.saveAsExcel();
			}

			// Load Agora Stock data
			
			$scope.$on("kendoWidgetCreated", function(event, widget){
      
        if (widget === $scope.AgoraStockKendoSpreadsheet) { 
					
					$scope.loadData();
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
										ng-click="loadData()"
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