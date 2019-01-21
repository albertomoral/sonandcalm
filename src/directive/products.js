
  //( https://docs.telerik.com/kendo-ui/controls/data-management/treelist/how-to/hide-edit-fields-on-different-levels

	APP.directive(
		'poeticsoftUtilsProducts', 
	function() {

		function controller($scope, Errors, DataSource, $window, $http) {

      $scope.DataSource = DataSource;

      /* ----------------------------------------------------
      PRODUCT TREE LIST
      */

      // Editors

      /* Categories */

      var editCategories = function (container, options) {
        $('<select name="' + options.field + '"/>')
        .appendTo(container)
        .kendoMultiSelect({
          dataSource: DataSource.WooProductCategories,
          valuePrimitive: true,
          dataValueField: 'id',
          dataTextField: 'name'
        });
      };
      
      $scope.getCategories = function(DataItem) {

        var IDs = DataItem.category_ids.toJSON();

          //console.log('---------------------------');          

        return DataItem.category_ids.toJSON().map(function(ID) {

          var Categorie = DataSource.WooProductCategories.get(ID);
          var Text = Categorie ? Categorie.get('name') : 'Error';
          //console.log(ID);
          //console.log(Text);          

          return Text;
        }).join(' - ');
      }

      $scope.productTreeListConfig = {
        dataSource: DataSource.WooProducts,
        height: '100%',
        sortable: true,
        editable: 'incell',
        edit:function(E){

          var Level = this.dataSource.level(E.model);
          if(Level > 0) {

            $scope.ProductKendoTreeList.closeCell();
          }
        },
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
            template: '<div>{{ getCategories(dataItem) }}</div>',
            editor: editCategories,
            width: 200,
            attributes: {
              class: 'Editable'
            }
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
          }
        ],
        toolbar: [
          'excel',
          'pdf',
          {
            name: 'save',
            text: 'Guardar todo',
            click: function(){

              DataSource.WooProducts.sync();
            }
          }
        ]

        /*
            
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