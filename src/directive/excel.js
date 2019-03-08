
	APP.directive(
		'poeticsoftUtilsExcel', 
	function() {

		function controller(
			$http,
			$rootScope,
			$scope,
			$timeout,
			$window,
			Notifications,
			ExcelToWeb
		) {
			
			$scope.allowProcessing = false;

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
					
					$scope.AgoraKendoSpreadsheet
					.fromFile(e.files[0].rawFile)
					.then(sheetLoaded);
				}
			}

			var ProductsSheet;
			var FootPrint;
			var RowCount;

			function sheetLoaded() {				

				$rootScope.$broadcast('opendialog', {
					Title: 'Excel data process'
				});

				// There is a sheet "Products"

				$rootScope.$emit('notifydialog', 'Searching Products sheet...');

				ProductsSheet = $scope.AgoraKendoSpreadsheet.sheetByName('Productos');
				if(!ProductsSheet) {
					
					$rootScope.$emit('closedialog');
					return Notifications.show({ errors: 'Load an Excel file with a "Products" sheet' });
				}	

				// Fields secuence validation

				$rootScope.$emit('notifydialog', 'Validating sheet...');

				$http.get('/wp-json/poeticsoft/get-agora-fields-footprint')
				.then(
					function(Response) {

						if(Response.data.Status.Code == 'KO') {						
					
							$rootScope.$emit('closedialog');
							return Notifications.show({ errors: Response.data.Status.Reason });
						}

						FootPrint = Response.data.Data;
						RowCount = ProductsSheet._rows._count - 1;
						
						var Selection = ProductsSheet.range('A1:' + FootPrint.ForTree[0] + RowCount).select();
						var FieldsRow = Selection.values()[0];
						var FieldsFootPrint = FieldsRow.join('|');
						ProductsSheet.range('A2:' + FootPrint.ForTree[0] + RowCount).sort(FootPrint.ForTree[3]);
						ProductsSheet.range('A1:A1').select();

						if(FieldsFootPrint == FootPrint.FootPrint) {

							$rootScope.$emit('notifydialog', 'Sheet valid, processing...');
							$timeout(processSheet, 100);

						} else {
					
							$rootScope.$emit('closedialog');
							return Notifications.show(
								{ 
									errors: 'Error, Products sheet doesn\'t have appropiate fields structure, get another file.'
								},
								true,
								4000
							);
						}
					}
				);
			}

			function processSheet() {

				$rootScope.$emit('notifydialog', 'Creating product tree...');

				ProductsSheet.insertColumn(2);
				ProductsSheet.columnWidth(2, 170);
				var HeadCell = ProductsSheet.range(FootPrint.ForTree[1] + 1);
				HeadCell.value('Parent');

				var SKUParentCode = '';
				var SKUParent = '';
				var I = 1;
				var AlternateProduct = true;

				function parseRow() {

					var ParentRangeIndex = FootPrint.ForTree[1] + (I+1);
					var ParentCell = ProductsSheet.range(ParentRangeIndex);
					var SKURangeIndex = FootPrint.ForTree[2] + (I+1);
					var SKU = ProductsSheet.range(SKURangeIndex).value();

					if($.trim(SKU) != '') {

						var Code = SKU.split(',').join('.').split('.');
						var ParentCode = Code[0] + '.' + Code[1] + '.' + Code[2];

						if(ParentCode != SKUParentCode) { 

							SKUParent = SKU;
							SKUParentCode = ParentCode;
							AlternateProduct = !AlternateProduct;
						}

						ParentCell.value(SKUParent);
						var ProductColor = AlternateProduct ? '#dfdfdf' : '#ffffff';
						ProductsSheet.range('A' + (I+1) + ':' + FootPrint.ForTree[0] + (I+1)).background(ProductColor);
						
						$rootScope.$emit('notifydialog', I + ' - ' + SKU + ' > ' + SKUParent);

					} else {
						
						ProductsSheet.range('A' + (I+1) + ':' + FootPrint.ForTree[0] + (I+1)).background('#cc0000');
						ProductsSheet.range('A' + (I+1) + ':' + FootPrint.ForTree[0] + (I+1)).color('#ffffff');
						$rootScope.$emit('notifydialog', 'Product without SKU');
					}

					I++;

					if(I<RowCount + 1) {

						return $timeout(parseRow, 0);

					} else {

						$scope.allowProcessing = true;
						$rootScope.$emit('closedialog');
					}
				}
				parseRow();
			}
		
			$scope.AgoraSpreadsheetConfig = {
				toolbar: {
					home: false,
					insert: false,
					data: false
				}
			};

			// Generate excel to web products action

			$scope.generateWebProducts = function() {	
				
				var ProductsSheet = $scope.AgoraKendoSpreadsheet.sheetByName('Productos');
				var Rows = ProductsSheet.toJSON().rows;
				
				$scope.allowProcessing = false;
				
				ExcelToWeb.mergeProducts(Rows)
				.finally(function() {}); 
			}
		}

		return {
			restrict: 'E',
			replace: true,
			scope: true,
			controller: controller,
			template: `<div class="poeticsoft-utils-excel">
				<div class="SpreadsheetTools">
					<input kendo-upload="AgoraKendoUpload"
						     name="file"
						     type="file"
						     k-options="AgoraKendoUploadConfig"
					/>
					<div class="Actions">
						<button class="Generate k-button"
										ng-click="generateWebProducts()"
										ng-disabled="!allowProcessing">
							Generate web products
						</button>
					</div>
				</div>
				<div class="SpreadsheetView">
					<div kendo-spreadsheet="AgoraKendoSpreadsheet"
							 k-options="AgoraSpreadsheetConfig">
					</div>
				</div>
			</div>`
		};
	});