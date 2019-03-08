
APP.factory(
	'Categories', 
function (
	$q, 
	$rootScope, 
	$timeout, 
	Notifications, 
	Products
) {

	var FirstTimeReadProducts = false;
	var Self = {};
	var RemoteData;
	var LocalTree;

	function constructTree(Id) {

		var ID = Id || 0;
		var Nodes = RemoteData.filter(function(C) {

			return C.parentId == ID;
		});

		Nodes.forEach(function(N) {

			N.items = constructTree(N.id);
		});

		return Nodes;
	}

	Self.DS = new kendo.data.HierarchicalDataSource({});
	
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

			RemoteData = E.response.Data;
			Self.DS.data(constructTree());
		}
	});
	Self.RemoteDS.read();	
	
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
		error: Notifications.showNotifications
	});
	Self.RelationsDS.read();

	return Self;
});
	