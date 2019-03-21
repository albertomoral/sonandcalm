/* datasource-categories.js */

APP.factory(
	'Categories', 
function (
	Notifications
) {

	var Self = {};

	/* WEB CATEGORIES */
	
	var TreeData; // Buffer for construct tree		

	// Data source for CategoriesTreeViewConfig in Categories directive

	Self.DS = new kendo.data.HierarchicalDataSource({});

	// Load and transform data from woo-products-categories-read
	// a plain woocommerce categories list 
	// for consuming into a HierarchicalDataSource

	function constructTree(Id) {

		var ID = Id || 0;
		var Nodes = TreeData.filter(function(C) {

			return C.parentId == ID;
		});

		Nodes.forEach(function(N) {

			N.items = constructTree(N.id);
		});

		return Nodes;
	}
	
	Self.RemoteDS = new kendo.data.DataSource ({
		transport: {
			read: {
				url: '/wp-json/poeticsoft/woo-products-categories-read',
				type: 'GET',
				dataType: 'json'
			}
		},
		schema: { 
			model: {
				id: 'id',
				fields: {
					'id': { type: 'number', editable: false },
					'parentId': { type: 'string', editable: false },
					'name': { type: 'string', editable: false }
				}
			},
			data: 'Data',
			errors: function (Response) {

				if (Response.Status.Code == 'KO') { return Response.Status.Reason; }
				return null;
			}
		},		
		error: Notifications.showNotifications,
		requestEnd: function(E) {

			TreeData = E.response.Data;
			Self.DS.data(constructTree()); // Feed Self.DS
		}
	});
	Self.RemoteDS.read();
	
	// Data source for FamiliesListViewConfig in Categories directive

	Self.RelationsDS = new kendo.data.DataSource ({
		transport: {
			read: {
				url: '/wp-json/poeticsoft/woo-families-categories-read',
				type: 'GET',
				dataType: 'json'
			}
		},
		schema: { 
			model: {
				id: 'family',
				fields: {
					'family': { type: 'string', editable: false },
					'categories': []
				}
			},
			data: 'Data',
			errors: function (Response) {

				if (Response.Status.Code == 'KO') { return Response.Status.Reason; }
				return null;
			}
		},		
		error: Notifications.showNotifications,
		requestEnd: function(E) {			

			Self.updateFamiliesCategories();
		}
	});
	Self.RelationsDS.read();

	Self.updateFamilies = function(FamiliesList) {

		// Remove inexistent families

		var RemoveIndex = [];
		Self.RelationsDS
		.data()
		.toJSON()
		.forEach(function(Family, Index) {

			if(FamiliesList.indexOf(Family.family) == -1) {

				Self.RelationsDS.remove(Self.RelationsDS.get(Family.family));
			};
		});

		// Add new families

		FamiliesList.forEach(function(Family) {

			var FamilyExistent = Self.RelationsDS.get(Family);
			if(!FamilyExistent) {

				Self.RelationsDS.add({
					family: Family,
					categories: []
				})
			}
		});

		Self.updateFamiliesCategories();
	}

	Self.FamilyCategories = {};
	Self.updateFamiliesCategories = function() {

		Self.RelationsDS
		.data()
		.toJSON()
		.forEach(function(Family, Index) {

			Self.FamilyCategories[Family.family] = Family.categories;
		});
	}

	return Self;
});
	