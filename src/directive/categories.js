/* categories.js */

APP.directive(
    'poeticsoftWooAgoraCategories', 
  function() {

    function controller(
      $scope, 
      $http, 
      Notifications, 
      Categories
    ) {

      $scope.SelectedCategorieId = null;
      $scope.TreeChanged = false;

      function loadRelations(E) {

        $scope.FamiliesListView.clearSelection();

        if(E) {

          $scope.$apply(function() {

            $scope.SelectedCategorieId = jQuery(E.currentTarget).data('categorieid');
          });
        }
        
        var $Items = $scope.FamiliesListView.element.children();

        var Families = Categories.RelationsDS.data();
        for (var i = 0; i < Families.length; i++) {
          
          var Relation = Categories.RelationsDS.at(i);
          var RelationCategories = Relation.get('categories').toJSON();
          if(RelationCategories.indexOf($scope.SelectedCategorieId) != -1) {

            $scope.FamiliesListView.select($Items[i]);
          }
        }
      }

      // Update relations 

      function dropCategorie(List) {

        var NewList = [];
        List.forEach(function(Item) {

          if(Item != $scope.SelectedCategorieId) { NewList.push(Item); }
        });

        return NewList;
      }

      function addCategorie(List) {

        if(List.indexOf($scope.SelectedCategorieId) == -1) {

          List.push($scope.SelectedCategorieId);
        }

        return List;
      }

      $scope.updateRelations = function(E) {

        var $Selection = $scope.FamiliesListView.select();
        var SelectedFamilies = [];
        var Families = Categories.RelationsDS.data();

        $Selection.each(function(F) {

          SelectedFamilies.push(jQuery(this).data('family'));
        });

        for (var i = 0; i < Families.length; i++) {
          
          var Relation = Categories.RelationsDS.at(i);
          var Family = Relation.get('family');
          var Cs = Relation.get('categories').toJSON();

          if(SelectedFamilies.indexOf(Family) == -1) {

            Relation.set('categories', dropCategorie(Cs, Family));

          } else {

            Relation.set('categories', addCategorie(Cs, Family));
          }
        }

        $scope.TreeChanged = true;

        loadRelations();
      }

      $scope.revert = function() {

        Notifications.show('Revert relations to saved...', true);

        $scope.TreeChanged = false;

        Categories.RelationsDS.read()
        .then(function() {

          Notifications.hide();
          loadRelations();
        });
      }

      $scope.save = function() {

        Notifications.show('Saving new web categorization...');

        $scope.TreeChanged = false;

        $http.post(
          '/wp-json/poeticsoft/woo-families-categories-update',
          Categories.RelationsDS.data().toJSON()
        )
        .then(function(Response) {

          var Code = Response.data.Status.Code;
          if(Code == 'OK'){            

            Notifications.show(Response.data.Status.Message);
          } else {

            Notifications.show({ errors: Response.data.Status.Reason });
            $scope.TreeChanged = true;
          }
        });
      }

      // Widgets

      $scope.CategoriesTreeViewConfig = {
        dataSource: Categories.DS,
        template: `<div class="TreeViewItem"
          data-categorieid="#= item.id #">
          #= item.name #
        </div>`
      };

      $scope.FamiliesListViewConfig = {
        dataSource: Categories.RelationsDS,
        selectable: 'multiple',        
        template: `<div class="ListViewItem"
          data-family="#= family #">
          #= family # [#= categories.length #]
        </div>`
      };
      
      // Events
      
      $scope.$on("kendoWidgetCreated", function(event, widget){
      
        if (widget === $scope.CategoriesTreeView) {
          
          $scope.CategoriesTreeView.element.on('click', '.TreeViewItem', loadRelations);
        }
      });
    }

    return {
      restrict: 'E',
      replace: true,
      scope: true,
      controller: controller,
      template: `<div class="poeticsoft-woo-agora-categories">
        <div class="Tools">
          <button data-ng-click="revert()"
                  ng-disabled="!TreeChanged"
                  class="k-button">
            Revert to saved
          </button>
          <button data-ng-click="save()"
                  ng-disabled="!TreeChanged"
                  class="k-button">
            Save to web
          </button>
        </div>
        <div class="Views">
          <div class="Categories">
            <div class="Head">Web</div>
            <div class="CategoriesTreeView"
                kendo-tree-view="CategoriesTreeView"
                k-options="CategoriesTreeViewConfig">
            </div>
          </div>
          <div class="Tools">
            <button ng-click="updateRelations()"
                    ng-disabled="!SelectedCategorieId"
                    class="k-button">
              Update Category
            </button>
          </div>
          <div class="Families">
            <div class="Head">
              Families 
              <small>
                (Ctrl + Click to unselect or multiple select)
              </small>
            </div>
            <div class="FamiliesListView"
                kendo-list-view="FamiliesListView"
                k-options="FamiliesListViewConfig">
            </div>
          </div>
        </div>
      </div>`
    };
  });