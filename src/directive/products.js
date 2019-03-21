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
    Categories,
    Images
  ) {

    /* ----------------------------------------------------
      PRODUCT TREE LIST
    */

    // Render categories field with names
    
    $scope.getCategories = function(DataItem) {

      if(!DataItem.category_ids) { return ''; }

      return DataItem.category_ids.toJSON().map(function(ID) {

        var Categorie = Categories.DS.get(ID);
        var Text = Categorie ? Categorie.get('name') : 'Error';
        return Text;
      })
      .join(' - ');
    } 

    $scope.haveImages = function(SKU) {

      return Images.Group[SKU] && Images.Group[SKU].count || 0;
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
        field: 'image_id',
        title: 'Image/s',
        width: 70,
        template: '<span class="Image">{{ haveImages(dataItem.sku) }}</span>'
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
      columns: Columns,
      toolbar: [
        {
          name: 'reload',
          text: 'Revert to last saved',
          imageClass: 'k-icon k-i-undo Revert',
          click: revertFromWeb
        },
        {
          name: 'savetoweb',
          text: 'Update web',
          imageClass: 'k-icon k-i-save Save',
          click: saveToWeb
        }
      ]
    }; 

    /* Tool bar */

    var $RevertButton;
    var $SaveButon;

    function revertFromWeb() {       

      $rootScope.$broadcast('opendialog', {
        Title: 'Revert from WordPress..'
      });
      $rootScope.$emit('notifydialog', { text: 'Loading...' }); 

      Products.loadFromWeb()
      .then(function() {

        $RevertButton.prop('disabled', true);
        $SaveButton.prop('disabled', true);
        $rootScope.$emit('closedialog');
      });
    }

    function saveToWeb() {     

      $rootScope.$broadcast('opendialog', {
        Title: 'Saving to WordPress..'
      });
      $rootScope.$emit('notifydialog', { text: 'Saving...' }); 

      Products.saveToWeb()
      .then(function() {

        // $RevertButton.prop('disabled', true);
        // $SaveButton.prop('disabled', true);
        $rootScope.$emit('closedialog');
      });
    }    

		$scope.$on('productschanged', function() {        

      $RevertButton.prop('disabled', false);
      $SaveButton.prop('disabled', false);
    });

    /* Resize grid */

    function resize() {        

      $scope.ProductKendoTreeList.resize();
    }

    $scope.$on("kendoWidgetCreated", function(event, widget){
      
      if (widget === $scope.ProductKendoTreeList) {

        var $GridElement = $($scope.ProductKendoTreeList.element);

        $RevertButton = $GridElement.find('.k-grid-toolbar button[data-command="reload"]');
        $SaveButton = $GridElement.find('.k-grid-toolbar button[data-command="savetoweb"]');

        $RevertButton.prop('disabled', true);
        $SaveButton.prop('disabled', true);

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