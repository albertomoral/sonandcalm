/* products.js */

//( https://docs.telerik.com/kendo-ui/controls/data-management/treelist/how-to/hide-edit-fields-on-different-levels

APP.directive(
  'poeticsoftWooAgoraProducts', 
function() {

  function controller(
    $rootScope,
    $scope, 
    $window, 
    Products, 
    Categories,
    Images,
    Stock
  ) {

    /* ----------------------------------------------------
      PRODUCT TREE LIST
    */

    $scope.haveImages = function(SKU) {

      return Images.Group[SKU] && Images.Group[SKU].count || 0;
    }

    function checkValue(Var) {

      if(typeof Var == 'undefined' || Var === null) {

        return '0';
      } 

      return Var;
    }

    /* Columns config */    

    var Columns = [
      {
        field: 'name',
        title: 'Name',
        expandable: true
      },
      {
        field: 'type',
        title: 'Type',
        width: 100,
        template: '<div class="#= type #">#= type #</div>',
        attributes: { class: 'Type' }
      },
      {
        title: 'Stock',
        columns: [
          {
            field: 'stock_quantity',
            title: 'Web',
            width: 60,
            attributes: { class: 'Web' }
          },
          {
            field: 'last_stock_quantity',
            title: 'Last',
            width: 60,
            attributes: { class: 'Last' }
          },
          {
            field: 'actual_stock_quantity',
            title: 'Actual',
            width: 60,
            attributes: { class: 'Actual' }
          },
          {
            field: 'export_stock_quantity',
            title: 'Export',
            width: 60,
            attributes: { class: 'Export' }
          }
        ],
        attributes: { class: 'Stock' }
      }, 
      {
        title: 'Image/s',
        width: 70,
        template: '{{ haveImages(dataItem.sku) }}',
        attributes: { class: 'Image' }
      },
      {
        field: 'status',
        title: 'Status',
        width: 60,
        template: '<div class="k-icon #= status #" title="#= status #"></div>',
        attributes: { class: 'Status' }
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
          text: 'Update web products',
          imageClass: 'k-icon k-i-save Save',
          click: saveToWeb
        }
      ]
    }; 

    /* Tool bar */

    function revertFromWeb() {       

      $rootScope.$broadcast('opendialog', {
        Title: 'Revert from WordPress..'
      });
      $rootScope.$emit('notifydialog', { text: 'Loading...' }); 

      Products.loadFromWeb()
      .then(function() {

        $SaveButton.prop('disabled', true);
        $rootScope.$emit('closedialog');
      });
    } 

    function saveToWeb() {     

      $rootScope.$broadcast('opendialog', {
        Title: 'Saving to WordPress..'
      });
      $rootScope.$emit('notifydialog', { text: 'Saving...' }); 

      Stock.saveState()
      .then(function() {

        Categories.saveRelations();

        Products.saveToWeb()
        .then(function() {

          $rootScope.$emit('closedialog');
        });
      });
    }    

		$scope.$on('productschanged', function() {        

      $SaveButton.prop('disabled', false);
    });

    /* Resize grid */

    function resize() {        

      $scope.ProductKendoTreeList.resize();
    }

    /* Data tooltip */

    function dataContent(E) {

      var Row = jQuery(E.target).parents('tr');

      if(Row.length == 0) {

        return;
      }

      var RowData = $scope.ProductKendoTreeList.dataItem(Row.eq(0)).toJSON();
      var TooltipContent = '<div class="DataToolTip">';
      Object.keys(RowData)
      .forEach(function(Key) {

        var Field = RowData[Key];

        if(Field) {

          if(Key == 'category_ids') {

            Field = Field.map(function(ID) {

              var Categorie = Categories.RemoteDS.get(ID);
              var Text = Categorie ? Categorie.get('name') : 'Error';
              return '<div>(' + ID + ') ' + Text + '</div>';
            })
            .join('');
          }

          if(
            Key == 'attributes' ||
            Key == 'variations'
          ) {

            Field = Object.keys(Field)
            .map(function(Key) {

              var Name = Key;
              var Value = Field[Key].split('|').join(' - ');

              return '<div><span>' + Name + '</span><span>' + Value + '</span></div>';
            })
            .join('');
          }

          TooltipContent += `<div class="Field">
            <span class="Name">${ Key }</span>
            <span class="Value">${ Field }</span>
          </div>`
        }
      })
      TooltipContent += '</div>';

      return TooltipContent;
    }

    $scope.$on("kendoWidgetCreated", function(event, widget){
      
      if (widget === $scope.ProductKendoTreeList) {

        var $GridElement = jQuery($scope.ProductKendoTreeList.element);

        $RevertButton = $GridElement.find('.k-grid-toolbar button[data-command="reload"]');
        $SaveButton = $GridElement.find('.k-grid-toolbar button[data-command="savetoweb"]');

        $SaveButton.prop('disabled', true);

        var DataTooltip = $GridElement
        .find('.k-grid-content')
        .kendoTooltip({
          width: 450,
          position: 'left',
          content: dataContent,
          animation: {
            open: {
              effects: 'zoom',
              duration: 150
            }
          }
        }).data('kendoTooltip');

        DataTooltip.hide();

        $GridElement
        .on(
          'mouseenter',
          '.Status',
          function() {

            DataTooltip.show(jQuery(this));
          }
        );

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