/* products.js */

//( https://docs.telerik.com/kendo-ui/controls/data-management/treelist/how-to/hide-edit-fields-on-different-levels

APP.directive(
  'poeticsoftWooAgoraProducts', 
function() {

  function controller(
    $rootScope,
    $scope, 
    $timeout,
    $window, 
    Products, 
    Categories
  ) {

    /* ----------------------------------------------------
      PRODUCT TREE LIST
    */

    // Reload products

    function revert() {        

      $rootScope.$broadcast('opendialog', {
        Title: 'Revert from WordPress..'
      });
      $rootScope.$emit('notifydialog', { text: 'Loading...' });

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
        width: 200,
        attributes: { class: 'Editable {{ dataItem.type }}' }
      },
      /*
      {
        field: 'image_id',
        title: 'Imagen',
        width: 90
      },
      { 
        title: 'Images',
        template: '<div class="k-icon">{{ getProductImages(dataItem.sku) }}</div>',
        width: '65px',
        attributes: {
          class: 'Images'
        }
      },
      */
      {
        field: 'price',
        title: 'Price',
        width: 90
      },
      {
        field: 'stock_quantity',
        title: 'Stock',
        width: 90
      },
      {
        field: 'status',
        title: 'Status',
        width: 60,
        template: '<div class="k-icon #= status #" title="#= status #"></div>',
        attributes: {
          class: 'Status'
        }
      }
    ];

    $scope.productTreeListConfig = {
      dataSource: Products.DS,
      sortable: true,
      resizable: true, 
      autoBind: false,     
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
        'pdf'
      ]
    }; 

    function resize() {        

      $scope.ProductKendoTreeList.resize();
    }

    $scope.$on("kendoWidgetCreated", function(event, widget){
      
      if (widget === $scope.ProductKendoTreeList) {
        
        resize();
      }
    });

    angular.element($window).on('resize', resize);
  }

  return {
    restrict: 'E',
    replace: true,
    scope: true,
    controller: controller,
    template: `<div class="poeticsoft-woo-agora-products">
      <div class="WebProductsView">
        <div kendo-tree-list="ProductKendoTreeList"
              id="ProductKendoTreeList"
              k-options="productTreeListConfig">
        </div>
      </div>
    </div>`
  };
});