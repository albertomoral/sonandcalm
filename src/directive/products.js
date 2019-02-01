
  //( https://docs.telerik.com/kendo-ui/controls/data-management/treelist/how-to/hide-edit-fields-on-different-levels

	APP.directive(
		'poeticsoftUtilsProducts', 
	function() {

		function controller(
      $scope, 
      $timeout,
      $element,
      Errors, 
      Products, 
      Categories, 
      $window, 
      $http
    ) {

      /* ----------------------------------------------------
        PRODUCT TREE LIST
      */

      /* Categories editor */

      var editCategories = function (container, options) {
        $('<select name="' + options.field + '"/>')
        .appendTo(container)
        .kendoMultiSelect({
          dataSource: Categories.DS,
          valuePrimitive: true,
          dataValueField: 'id',
          dataTextField: 'name'
        });
      };

      function beforeEdit(E) {

        if(E.model.parent_sku) { E.preventDefault(); }
      }

      function cellClose(E) {

        if(E.type == 'save') {

          var NewValue = E.model.get('category_ids');
          var ChildNodes = Products.DS.childNodes(E.model);

          ChildNodes.forEach(function(Child) {

            Child.set('category_ids', NewValue);
          });
        }
      }

      // Render categories field with names
      
      $scope.getCategories = function(DataItem) {

        if(!DataItem.category_ids) {

          return '';        
        }

        return DataItem.category_ids.toJSON().map(function(ID) {

          var Categorie = Categories.DS.get(ID);
          var Text = Categorie ? Categorie.get('name') : 'Error';
          return Text;
        })
        .join(' - ');
      }     

      /* Columns config */

      var Columns = [
        {
          field: 'name',
          expandable: true,
          title: 'Name'
        },
        {
          field: 'sku',
          title: 'SKU',
          width: 200
        },
        {
          field: 'category_ids',
          title: 'Categorias',
          template: '{{ getCategories(dataItem) }}',
          editor: editCategories,
          width: 200,
          attributes: { class: 'Editable {{ dataItem.type }}' }
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
      ];

      $scope.productTreeListConfig = {
        dataSource: Products.DS,
        sortable: true,
        editable: 'incell',
        beforeEdit: beforeEdit,
        cellClose: cellClose,
        collapse: function(e) {
          
          e.preventDefault();
        },
        autoBind: false,
        columns: Columns,
        pageable: {
          pageSize: 20,
          pageSizes: [20, 50, 'All']
        },
        toolbar: [
          'excel',
          'pdf',
          {
            name: 'save',
            text: 'Guardar todo',
            click: function(){

              Products.DS.sync();
            }
          }
        ]
      }; 
      
      $scope.TreeListReady = false;
      $scope.$on('hideproductsgrid', function(event) {

        $scope.$apply(function() {
            
          $scope.TreeListReady = false;
        });
      });

      $scope.$on('showproductsgrid', function(event) {

        $scope.$apply(function() {
            
          $scope.TreeListReady = true;

          $timeout(function() {

            var ProductKendoTreeList = $($element).find('#ProductKendoTreeList').data('kendoTreeList');
            ProductKendoTreeList.refresh();
          });
        });
      });
		}

		return {
			restrict: 'E',
			replace: true,
			scope: true,
			controller: controller,
			template: `<div class="poeticsoft-utils-products">
        <div class="WebProductsView">
          <div kendo-tree-list="ProductKendoTreeList"
               id="ProductKendoTreeList"
               k-options="productTreeListConfig"
               ng-if="TreeListReady">
          </div>
          <div class="k-loading-mask"
               ng-if="!TreeListReady">
            <span class="k-loading-text">Loading...</span>
            <div class="k-loading-image"></div>
            <div class="k-loading-color"></div>
          </div>
				</div>
			</div>`
		};
	});