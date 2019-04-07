/* products.js */

//( https://docs.telerik.com/kendo-ui/controls/data-management/treelist/how-to/hide-edit-fields-on-different-levels

APP.directive(
  'poeticsoftWooAgoraProducts', 
function() {

  function controller(
    $rootScope,
    $scope, 
    $window, 
    $timeout,
    Products, 
    Categories,
    Images,
    Stock
  ) {

    /* ----------------------------------------------------
      PRODUCT TREE LIST
    */

    $scope.uploadedImages = function(SKU) {

      return Images.Group[SKU] && Images.Group[SKU].count || 0;
    }

    $scope.assignedImages = function(Item) {

      return (Item.image_id ? 1 : 0) + 
              ' / ' + 
              ((Item.gallery_image_ids && Item.gallery_image_ids.length) || 0);
    }

    $scope.statusChanged = function(Item) {

      if(Item.status == 'changed' && Item.changes.indexOf('stock') != -1) {

        return 'stockchanged';
      }
      
      if(Item.changes && Item.changes.indexOf('exportstock') != -1) {

        return 'exportstock';
      }

      return '';
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
            template: '<span title="Actual stock in web" ' +
                            'class="#= type # {{ statusChanged(dataItem) }}">' +
                          '#= stock_quantity != null ? stock_quantity : "" #' +
                      '</span>',
            width: 60,
            attributes: { class: 'Web' }
          },
          {
            field: 'last_stock_quantity',
            title: 'Last',
            template: '<span title="Last value loaded from excel stock" ' +
                            'class="#= type # {{ statusChanged(dataItem) }}">' +
                        '#= last_stock_quantity != null ? last_stock_quantity : "" #' +
                      '</span>',
            width: 60,
            attributes: { class: 'Last' }
          },
          {
            field: 'import_stock_quantity',
            title: 'Import',
            template: '<span title="Actual value loaded from stock excel" ' +
                            'class="#= type # {{ statusChanged(dataItem) }}">' +
                        '#= import_stock_quantity != null ? import_stock_quantity : "" #' +
                      '</span>',
            width: 60,
            attributes: { class: 'Import' }
          },
          {
            field: 'export_stock_quantity',
            title: 'Export',
            template: '<span title="Value to export in stock excel" ' +
                            'class="#= export_stock_quantity < 0 ? \"Negative\" : \"\" # ' +
                            '#= type # {{ statusChanged(dataItem) }}">' +
                        '#= export_stock_quantity != null ? export_stock_quantity : "" #' + 
                      '</a>',
            width: 60,
            attributes: { class: 'Export' }
          }
        ],
        attributes: { class: 'Stock' }
      }, 
      {
        title: 'Image/s',
        columns: [
          {
            title: 'Asigned',
            width: 70,
            template: '{{ assignedImages(dataItem) }}',
            attributes: { class: 'Image' }
          },
          {
            title: 'Upload',
            width: 70,
            template: '{{ uploadedImages(dataItem.sku) }}',
            attributes: { class: 'Image' }
          }
        ]
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
          text: 'Revert to web last saved',
          imageClass: 'k-icon k-i-undo Revert',
          click: revertFromWeb
        },
        {
          name: 'savetoweb',
          text: 'Update web products & excel stock',
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

        $rootScope.$emit('closedialog');
      });
    } 

    function saveToWeb() { 
      
      if(Products.CanUpdateWeb) {

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
      } else {

        $rootScope.$broadcast('opendialog', {
          Title: 'Stock negative!'
        });
        $rootScope.$emit('notifydialog', { text: 'Cannot update web with negative stock' }); 

        $timeout(function() {

          $rootScope.$emit('closedialog');
        }, 1000);
      }
    }

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
      var Fields = Object.keys(Products.DSConfig.schema.model.fields);
      var TooltipContent = '<div class="DataToolTip">';

      Fields
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
      });
      
      TooltipContent += '</div>';

      return TooltipContent;
    }

    $scope.$on("kendoWidgetCreated", function(event, widget){
      
      if (widget === $scope.ProductKendoTreeList) {

        var $GridElement = jQuery($scope.ProductKendoTreeList.element);

        $RevertButton = $GridElement.find('.k-grid-toolbar button[data-command="reload"]');

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
            return false;
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