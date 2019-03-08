
  //( https://docs.telerik.com/kendo-ui/controls/data-management/treelist/how-to/hide-edit-fields-on-different-levels

	APP.directive(
		'poeticsoftUtilsProducts', 
	function() {

		function controller(
      $rootScope,
      $scope, 
      $timeout,
      $element,
      Notifications,
      Products, 
      Categories, 
      Images,
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

      // Reload products

      function revert() {        

        $rootScope.$broadcast('opendialog', {
          Title: 'Revert from WordPress..'
        });
        $rootScope.$emit('notifydialog', 'Loading...');

        Products.RemoteDS.read()
        .then(function() {

          $rootScope.$emit('closedialog');
        });
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
      
      $scope.getProductImages = function(SKU) {

        return '';

        return Images.ImageGroups[SKU] ? Images.ImageGroups[SKU].count : '';
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
          title: 'Categories',
          template: '{{ getCategories(dataItem) }}',
          // editor: editCategories,
          width: 200,
          attributes: { class: 'Editable {{ dataItem.type }}' }
        },
        /*
        {
          field: 'image_id',
          title: 'Imagen',
          width: 90
        },
        */
        { 
          title: 'Images',
          template: '<div class="k-icon">{{ getProductImages(dataItem.sku) }}</div>',
          width: '65px',
          attributes: {
            class: 'Images'
          }
        },
        {
          field: 'price',
          title: 'Price',
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
        resizable: true,
        beforeEdit: beforeEdit,
        cellClose: cellClose,
        collapse: function(e) {
          
          e.preventDefault();
        },
        columns: Columns,
        pageable: {
          pageSize: 20,
          pageSizes: [20, 50, 'All']
        },
        toolbar: [
          {
            name: 'reload',
            text: 'Reload',
            click: revert
          },
          'excel',
          'pdf',
          {
            name: 'save',
            text: 'Save',
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

        $scope.TreeListReady = true;

        $timeout(function() {

          var ProductKendoTreeList = $($element).find('#ProductKendoTreeList').data('kendoTreeList');
        }, 0);
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