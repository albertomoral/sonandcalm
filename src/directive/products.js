
	APP.directive(
		'poeticsoftUtilsProducts', 
	function() {

		function controller($scope, Errors, DataSource, $window, $http) {

      $scope.DataSource = DataSource;

      /* ----------------------------------------------------
      PRODUCT TREE LIST
      */

      // Editors

      /*
      function editCategories(container, options) {

        $('<input required name="' + options.field + '"/>')
        .appendTo(container)
        .kendoDropDownList({
          dataSource: DataSource.WooProductCategories,
          dataValueField: 'id',
          dataTextField: 'name'
        });
      }
      */

      var editCategories = function (container, options) {
        $('<select name="' + options.field + '"/>')
        .appendTo(container)
        .kendoMultiSelect({
          dataSource: DataSource.WooProductCategories,
          autoBind: false,
          dataValueField: 'id',
          dataTextField: 'name'
        });
      };

      $scope.getCategorie = function(id) {

        return DataSource.WooProductCategories.get(id).get('name');
      }

      function editSize(container, options) {

        $('<input required name="' + options.field + '"/>')
        .appendTo(container)
        .kendoDropDownList({
            autoBind: false,
            dataSource: DataSource.WooSizes
        });
      }

      $scope.productTreeListConfig = {
        dataSource: DataSource.WooProducts,
        height: '100%',
        filterable: true,
        sortable: true,
        editable: true,
        autoBind: false,
        columns: [
          {
            field: 'name',
            expandable: true,
            title: 'Name'
          },
          {
            field: 'sku',
            title: 'SKU',
            width: 120
          },
          {
            field: 'category_ids',
            title: 'Categorias',
            template: '<div>{{ dataItem.category_ids.map(getCategorie).join(" - ") }}</div>',
            editor: editCategories,
            width: 200
          },
          {
            field: 'image_id',
            title: 'Imagen',
            width: 90
          },
          {
            field: 'price',
            title: 'Precio',
            width: 90
          },
          {
            field: 'stock_quantity',
            title: 'Stock',
            width: 90
          },
          { 
            command: [
              'edit'
            ], 
            width: 190
          }
        ]/*,
            
        toolbar: [
          { 
            template: '<button data-ng-click="importExcel()" class="k-button" ">Copy from Excel</button>' 
          },
          'save',
          { 
            template: '<button data-ng-click="exportExcel()" class="k-button" ">Export Excel</button>' 
          },
          'cancel'
        ]*/
      }

      // RESIZE

      function resize() {        

        // $scope.ProductKendoTreeList.resize();
      }

      angular.element($window).on('resize', resize);

      $scope.$on("kendoWidgetCreated", function(event, widget){
      
        if (widget === $scope.ProductKendoTreeList) {
          
          setTimeout(resize, 0);
        }
      });
		}

		return {
			restrict: 'E',
			replace: true,
			scope: true,
			controller: controller,
			template: `<div class="poeticsoft-utils-products">
				<div class="AgoraProductsView">
					<div kendo-tree-list="ProductKendoTreeList"
               k-options="productTreeListConfig">
					</div>
				</div>
			</div>`
		};
	});