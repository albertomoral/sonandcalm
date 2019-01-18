

  APP.directive(
    'poeticsoftUtilsProducts', 
  function() {

    function controller($scope, Errors, DataSource, $window) {

      /* ----------------------------------------------------
      PRODUCT GRID
      */

      $scope.productGridConfig = {
        dataSource: DataSource.Products,
        height: '100%',
        editable: 'inline',
        autoBind: false,
        sortable: true,
        columns: [
          { 
            field: 'id', 
            title: 'ID',           
            width: '80px'
          },
          { 
            field: 'sku', 
            title: 'SKU',           
            width: '80px'
          },
          { 
            field: 'name',
            title: 'Name'
          }
        ],
        toolbar: [
          { 
            name: 'refresh', 
            template: '<button data-ng-click=\'refresh()\' class=\'k-button\'>Refresh</button>' 
          }
        ]
      }

      $scope.refresh = function() {

        $scope.ProductKendoGrid.dataSource.read();
      }      

      function resize() {        

        $scope.ProductKendoGrid.resize();
      }

      angular.element($window).on('resize', resize);

      $scope.$on("kendoWidgetCreated", function(event, widget){
      
        if (widget === $scope.ProductKendoGrid) {
          
          resize();
        }
      });
    }

    return {
      restrict: 'E',
      replace: true,
      scope: true,
      controller: controller,
      template: `<div class="poeticsoft-utils-products">
        <div kendo-grid="ProductKendoGrid"
          k-options="productGridConfig">
        </div>
      </div>`
    };
  });