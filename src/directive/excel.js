
	APP.directive(
		'poeticsoftUtilsExcel', 
	function() {

		function controller($scope, Errors, DataSource, Utils, $window) {

			// Loading Excel file

			$scope.AgoraLoadConfig = {
				multiple: false,
				async: {
					saveUrl: '/product-images/upload.php',
					autoUpload: false
				},
				validation: {
					allowedExtensions: ['.xlsx'],
				},
				select: function(e) {
					
					$scope.AgoraKendoSpreadsheet.fromFile(e.files[0].rawFile);
					$scope.$apply(function() {

						$scope.allowProcessing = true;
					});
				}
			}        
		
			$scope.AgoraSpreadsheetConfig = {
				toolbar: {
					home: false,
					insert: false,
					data: false
				}
			};

			// Generate products
			
			$scope.allowProcessing = true;

			var BlockCodes = {};
			var Families = {};

			function digestRows(Rows) {
				
				var HeaderRow = Rows.shift();
				var Fields = HeaderRow.cells.map(function(Cell) {

					return {
						Nick: Utils.toSlug(Cell.value + '_' + Cell.index),
						Name: Cell.value
					}
				});

				var ParentSKU = '';
				var RowsData = Rows.map(function(Row) {

					var RowData = {};

					Fields.forEach(function(Field, Index) {

						var Cell = Row.cells.find(function(C) {

							return C.index == Index;
						});

						RowData[Field.Nick] = {
							Field: Field.Name,
							Value: (Cell && Cell.value) || '',
							State: (Cell && Cell.background) || ''
						}
					});

					RowData.SKU = RowData['codigo_barras_5'].Value;
					if(RowData.SKU.trim() != '') {

						var Code = RowData.SKU.split(',').join('.').split('.');
						RowData.BlockCode = Code[0] + '.' + Code[1] + '.' + Code[2];
						RowData.ParentSKU = '';

						if(!BlockCodes[RowData.BlockCode]) {

							RowData.IsParent = true;
							ParentSKU = RowData.SKU;

							BlockCodes[RowData.BlockCode] = {
								Color: {},
								Size: {}
							};
						} else {

							RowData.ParentSKU = ParentSKU;
						}

						BlockCodes[RowData.BlockCode].Color[RowData['color_2'].Value] = 'color'; 	// Hack unique values
						BlockCodes[RowData.BlockCode].Size[RowData['talla_3'].Value] = 'size'; 		//
					}

					Families[RowData['familia_0'].Value] = 'family';

					return RowData;
				});

				Object.keys(BlockCodes)
				.forEach(function(BC) {

					BlockCodes[BC].Color = Object.keys(BlockCodes[BC].Color);
					BlockCodes[BC].Size = Object.keys(BlockCodes[BC].Size);
				});

				Utils.BlockCode = BlockCodes;
				Utils.Family = Object.keys(Families);
				
				return RowsData;
			}

			$scope.generateWebProducts = function() {			
				
				$scope.allowProcessing = false;

				$scope.$emit('opendialog', {
					Title: 'Processing products'
				});
				
				var ProductsSheet = $scope.AgoraKendoSpreadsheet.sheetByName('Productos');
				var Rows = ProductsSheet.toJSON().rows;
				
				DataSource.ProductsFromExcel = digestRows(Rows);

				DataSource.mergeProducts()
				.then(
					function(Success) {

						console.log('Success');
					},
					function(Error) {

						console.log('Error');
					}
				)
				
				$scope.allowProcessing = true;
			}

			// Resize

			function resize() {                

				$scope.AgoraKendoSpreadsheet.resize();
			}

			angular.element($window).on('resize', resize);

			$scope.$on("kendoWidgetCreated", function(event, widget){
			
				if (widget === $scope.AgoraKendoSpreadsheet) {
					
					setTimeout(resize, 0);
				}
			});
		}

		return {
			restrict: 'E',
			replace: true,
			scope: true,
			controller: controller,
			template: `<div class="poeticsoft-utils-excel">
				<div class="SpreadsheetTools">
					<input kendo-upload="AgoraKendoUpload"
						     name="image"
						     type="file"
						     k-options="AgoraLoadConfig"
					/>
					<div class="Actions">
						<button class="Generate k-button"
										data-ng-click="generateWebProducts()"
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