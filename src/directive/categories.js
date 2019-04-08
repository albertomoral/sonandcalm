/* categories.js */

APP.directive(
    'poeticsoftWooAgoraCategories', 
  function() {

    function controller(
      $rootScope,
      $scope,
      Notifications, 
      Categories,
      Products
    ) {

      $scope.SelectedCategorieId = null;
      $scope.TreeChanged = false;
      $scope.FamilySelectionChanged = false;

      function loadRelations(E) {

        $scope.FamiliesListView.clearSelection();
        $scope.FamilySelectionChanged = false;

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

          if(Item != $scope.SelectedCategorieId) { 
            
            NewList.push(Item); }
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

        $scope.FamilySelectionChanged = false;

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

      /* -------------------------------------------------------------------
        Change family selection TODO real changes */

      function changeFamilySelection(E) {

        var IsSelected = jQuery(E.target).hasClass('k-state-selected');
        var CtrlKey = E.ctrlKey;

        if(!(IsSelected && !CtrlKey)) {

          $scope.$apply(function() {

            $scope.FamilySelectionChanged = true;
          });
        }
      }

      /* -------------------------------------------------------------------
        Back to last saved relations  */

      $scope.revert = function() {

        Notifications.show('Revert relations to saved...', true);

        $scope.TreeChanged = false;

        Categories.RelationsDS.read()
        .then(function() {

          Notifications.hide();
          loadRelations();
        });
      }

      $scope.apply = function() {    

        $scope.TreeChanged = false;

        $rootScope.$broadcast('opendialog', {
          Title: 'Saving Families Categories relations...'
        });
        $rootScope.$emit('notifydialog', { text: 'Saving and updating products...' }); 

        Categories.saveRelations()
        .then(function() {
          
          Products.updateCategories();
            
          $rootScope.$emit('closedialog');
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
      
        if (widget === $scope.FamiliesListView) {
          
          $scope.FamiliesListView.element.on('mousedown', '.ListViewItem', changeFamilySelection);          
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
          <button data-ng-click="apply()"
                  ng-disabled="!TreeChanged"
                  class="k-button">
            Apply
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
                    ng-disabled="!FamilySelectionChanged"
                    class="k-button">
              Update Relation
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