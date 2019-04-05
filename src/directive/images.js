/* images.js */

APP.directive(
    'poeticsoftWooAgoraImages', 
  function() {

    function controller(
      $http,
      $scope, 
      Notifications, 
      Products,
      Images, 
      Loader, 
      $window,
      $element
    ) {

      /* UPLOAD */
      
      $scope.imageUploadConfig = {
        async: {
          saveUrl: '/wp-json/poeticsoft/woo-images-upload',
          autoUpload: true
        },
        success: function(result) {

          if(result.response.Status.Code == 'KO') {

            return Notifications.show({ errors: result.response.Status.Reason });
          }
        },
        complete: function() {

          $scope.imageGridConfig.dataSource.read();
        },
        validation: {
          allowedExtensions: ['.jpg', '.jpeg', '.png', '.gif'],          
          maxFileSize: 1
        },
        dropZone: '.Images .Upload'
      }

      $scope.clearUploadList = function() { 

        $scope.ImageKendoUpload.clearAllFiles();
      }

      /* LIST */

      $scope.haveProduct = function(SKU) {

        return Products.TempData[SKU] ? 'k-icon k-i-check-circle' : 'k-icon k-i-close-circle';
      }

      $scope.imageGridConfig = {
        dataSource: Images.DS,
        height: '100%',
        editable: 'inline',
        sortable: true,
        columns: [
          { 
            field: 'sku',
            title: '&nbsp',
            groupHeaderTemplate: '<span class="Product {{ haveProduct(dataItem.value) }}"></span>' +
                                 '#= value # ' +
                                 '<span class="Count">[#= count #]</span>',                                 
            template: '&nbsp;',            
            width: '1px',
            aggregates: ['count']
          },
          { 
            field: 'image', 
            title: '&nbsp;',
            template: '<a href="/wp-content/uploads/product-images/#: view  #?#= Math.round(Math.random() * 1000) #" ' +
                          'target="_new">' + 
                          '<img src="/wp-content/uploads/product-images/#: thumb  #?#= Math.round(Math.random() * 1000) #" ' +
                               'style="display: block; width:100%;"/>' +
                      '</a>',           
            width: '100px',          
            attributes: {
              style: 'padding: 0; border-width: 1px 0 0 0;'
            }
          },
          { 
            field: 'attid',
            title: 'ID',           
            width: '70px'
          },
          { 
            field: 'name', 
            title: 'File name'
          },
          { 
            field: 'date',
            title: 'Date',
            format: '{0:M/d/yyyy h:mm tt}',
            width: '150px'
          }
        ],
        toolbar: [
          { 
            name: 'refresh', 
            template: '<button data-ng-click="refresh()" class="k-button">Refresh</button>' 
          },
          {
            name: 'openall', 
            template: '<button data-ng-click="openall()" class="k-button">Open All</button>'
          },
          {
            name: 'closeall', 
            template: '<button data-ng-click="closeall()" class="k-button">Close All</button>'
          }
        ],
        dataBound: function (e) {

          var grid = this;

          jQuery(".k-grouping-row")
          .each(function (e) {
              grid.collapseGroup(this);
          });
       }
      }

      $scope.refresh = function() {

        Images.DS.read();
      }
      
      $scope.openall = function() {

        $scope.ImageKendoGrid
        .element.find('.k-grouping-row')
        .each(function (e) {
          $scope.ImageKendoGrid.expandGroup(this);
        });
      }
      
      $scope.closeall = function() {

        $scope.ImageKendoGrid
        .element.find('.k-grouping-row')
        .each(function (e) {
          $scope.ImageKendoGrid.collapseGroup(this);
        });
      }

      function resize() {        

        $scope.ImageKendoGrid.resize();
      }

      angular.element($window).on('resize', resize);

      $scope.$on("kendoWidgetCreated", function(event, widget){
      
        if (widget === $scope.ImageKendoGrid) {
          
          resize();
        }
      
        if (widget === $scope.ImageKendoUpload) {

          $http.get(
            '/wp-json/poeticsoft/get-max-upload-size'
          )
          .then(function(Response) {
    
            var Code = Response.data.Status.Code;
            if(Code == 'OK'){            
    
              $scope.ImageKendoUpload.options.validation.maxFileSize = Response.data.Data.MaxSize;

              Loader.ready('MaxUploadSize');
    
            } else {
    
              Notifications.show({ errors: Response.data.Status.Reason });
            }
          });

          jQuery($element)
          .find('.k-widget.k-upload.k-header')
          .prepend(jQuery('<span>You can drag and drop images here (jpg, gif, png)</span>'));
        }
      });
    }

    return {
      restrict: 'E',
      replace: true,
      scope: true,
      controller: controller,
      template: `<div class="poeticsoft-woo-agora-images">
        <div class="Images">
          <div class="Upload">
            <div class="UploadImageTools">           
              <input type="button" 
                value="Clear" 
                class="k-button" 
                ng-click="clearUploadList()"  
              />
            </div>
            <input kendo-upload="ImageKendoUpload"
              name="image"
              type="file"
              k-options="imageUploadConfig"
            />
          </div>
          <div class="List">
            <div kendo-grid="ImageKendoGrid"
              k-options="imageGridConfig">
            </div>
          </div>
        </div>
      </div>`
    };
  });