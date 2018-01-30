(function ()
{
	'use strict';

	angular
		.module('app.support')
		.controller('SupportController',  SupportController);

	/** @ngInject */
	function SupportController( $scope,$http,$timeout,$charge,notifications)
	{
		var vm = this;
		var userId = null;
		$scope.support = {};
		$scope.emptyTickets = null;
		$scope.submitOnProcess = false;
		$scope.loadingTickets = false;
		var supportObg = {
			"channel": null,
			"description": null,
			"engagementSession": null,
			"requester": null,
			"subject": "CloudCharge issue",
			"tags": ["VIP","CloudCharge"],
			"type": "complain"
		};
		var engagementData = {
			"channel": "api",
			"channelFrom": "cloudcharge",
			"channel_to": "veery",
			"direction": "inbound",
			"userId": null
		};
		var baseURL = "https://cloudcharge.com";

		// (function () {
		// 	if(baseURL == null){
		// 		$http.get('app/core/cloudcharge/js/config.json').then(function(data){
		// 			baseURL = data.data.support.domain;
		// 		}, function (data) {});
		// 	}
		// })();

		/** Helper functions */
		function gst(name) {
			var nameEQ = name + "=";
			var ca = document.cookie.split(';');
			for (var i = 0; i < ca.length; i++) {
				var c = ca[i];
				while (c.charAt(0) == ' ') c = c.substring(1, c.length);
				if (c.indexOf(nameEQ) == 0) return c.substring(nameEQ.length, c.length);
			}
			return null;
		}
		function parseJwt (token) {
			var base64Url = token.split('.')[1];
			var base64 = base64Url.replace('-', '+').replace('_', '/');
			return JSON.parse(window.atob(base64));
		}

		function getDomain () {
			var dom = gst('currentDomain');
			var _dom = gst('domain');
			return (dom != null) ? dom : _dom;
		}
		/** Helper functions - END */

		var idToken = gst('securityToken');
		//var idToken = "eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiIsImtpZCI6Ilg1ZVhrNHh5b2pORnVtMWtsMll0djhkbE5QNC1jNTdkTzZRR1RWQndhTmsifQ.eyJleHAiOjE1MDA0NjU5ODMsIm5iZiI6MTUwMDM4MzE4MywidmVyIjoiMS4wIiwiaXNzIjoiaHR0cHM6Ly9sb2dpbi5taWNyb3NvZnRvbmxpbmUuY29tL2MxZjlmOGU2LTM0NjktNGQ1Zi1hMzI2LTgzZTk5MGE5OTI2YS92Mi4wLyIsInN1YiI6IjNkZThhZGNlLTYyNTctNDQ1Zi04YTMyLTU3NjhlZDRlNzA1ZSIsImF1ZCI6ImQwODRhMjI3LWJiNTItNDk5Mi04ODlkLTZlNDgzNTYxMGU3NiIsIm5vbmNlIjoiZGVmYXVsdE5vbmNlIiwiaWF0IjoxNTAwMzgzMTgzLCJhdXRoX3RpbWUiOjE1MDAzODMxODMsIm9pZCI6IjNkZThhZGNlLTYyNTctNDQ1Zi04YTMyLTU3NjhlZDRlNzA1ZSIsImdpdmVuX25hbWUiOiJLYXN1biIsIm5hbWUiOiJXaWplcmF0bmUiLCJjb3VudHJ5IjoiU3JpIExhbmthIiwiZXh0ZW5zaW9uX21vZGUiOiJzYW5kYm94IiwiZXh0ZW5zaW9uX0RvbWFpbiI6Imthc3VuZGV2LmFwcC5jbG91ZGNoYXJnZS5jb20iLCJmYW1pbHlfbmFtZSI6ImZyZWVfdHJpYWwiLCJqb2JUaXRsZSI6ImFkbWluIiwiZW1haWxzIjpbImthc3VuLndAZHVvc29mdHdhcmUuY29tIl0sInRmcCI6IkIyQ18xX0RlZmF1bHRQb2xpY3kifQ.eGGdGyICJLWLVuCQslf64ezDTHpV35yjISmrBGewPUvBlANRHf2iGNoCqXhyYFKe6N149HuQS38PLMRNnhcjSgiD1tWhs6Gg355lBSfViRKKDX820YWWtx4kzYjE7dd92EnJ9w5pEt135NYKK8JuhCjOwJmYt2tvDzfNn7gtnUlFo7vdTsgeFlXrUdNjrv4CrYRVyzc1Vy7EX-50Ut2qGizjXt9fpFO7Hen7goiefRKxofye6gcgH5brQpf19PgT9nEer6quI8OhZ_3VMx_FSh4gwgQHhlQ9P3fSDJ7iGlzulBDEbvAYOKlDpZFs6PJMwyz1Knzqzo1QMsGsXYtycA";
		var _domain = getDomain();

		/** General user data */
		var user_email = parseJwt(idToken).emails[0];
		var user_fname = parseJwt(idToken).name;
		var user_lname = parseJwt(idToken).given_name;
		var oid = parseJwt(idToken).oid;
		var domain = parseJwt(idToken).extension_Domain.split(".")[0];
		domain = "CloudCharge-"+domain;
		/** General user data - END*/

		var newUserData = {
			"title": "Mr",
			"gender": "Male",
			"firstName": null,
			"lastName": null,
			"ssn": oid,
			"phone": oid,
			"email": null,
			"address": {
				"zipcode": "",
				"number": "",
				"street": "",
				"city": "",
				"province": "",
				"country": ""
			}
		};
		var newTicketData = {
			"channel": "api",
			"description": null,
			"engagementSession": null,
			"requester": null,
			"subject": domain,
			"tags": ["VIP","CloudCharge"],
			"type": "complain",
			"status": "new"
		};

		/** Check for already registered users */
		$scope.getUserInfoByEmail = function (callback) {
			// $charge.ccSupport().getUserByField("email", user_email)
			// .success(
			// 	function (successResponse) {
			// 		debugger;
			// 	}, function (errorResponse) {
			// 		debugger;
			// });
			if(userId == null){
				$http({
					method : 'GET',
					url : baseURL+"/services/duosoftware.supportAPI/support/getUserByField?fieldName=email&value="+user_email,
					headers: {
						'idToken': idToken,
						'domain': _domain
					}}).then(function(successResponse) {
						if(successResponse.data.IsSuccess && successResponse.data.Result.length == 0){
							$scope.registerNewUser(function (_id) {
								return callback(_id);
							});
						}else{
							userId = successResponse.data.Result[0]._id;
							if(userId != undefined || userId != null){
								return callback(userId);
							}else{
								return null;
							}
						}
				}, function(response) {
					return null;
				});
			}else{
				return callback(userId);
			}
		};
		/** Check for already registered users - END */

		/** Register a new user */
		$scope.registerNewUser = function (callback) {
			newUserData.firstName = user_fname;
			newUserData.lastName = user_lname;
			newUserData.email = user_email;
			if(newUserData.email != null){
				$http({
					method : 'POST',
					url : baseURL+"/services/duosoftware.supportAPI/support/registerUser",
					headers: {
						'idToken': idToken,
						'Content-Type' : 'application/json',
						'domain': _domain
					},
					data:newUserData
				})
				.then(function(successResponse) {
					if(successResponse.data.Result.IsSuccess){
						userId = successResponse.data.Result._id;
						return callback(userId);
					}else{
						notifications.toast("Something went wrong. Please try again", "Error");
						return null;
					}
				}, function(response) {
					notifications.toast("Something went wrong. Please try again", "Error");
					return null;
				});
			}
		};
		/** Register a new user - END */

		/** Create new ticket */
		$scope.createANewTicket = function () {
			engagementData.userId = userId;
			$http({
				method : 'POST',
				url : baseURL+"/services/duosoftware.supportAPI/support/createEngagement",
				headers: {
					'idToken': idToken,
					'Content-Type' : 'application/json',
					'domain': _domain
				},
				data: engagementData
			})
			.then(function(successResponse) {
				var engagementId = successResponse.data.Result.engagement_id;
				if(engagementId != undefined || engagementId != null){
					newTicketData.engagementSession = engagementId;
					newTicketData.requester = userId;
					newTicketData.description = $scope.support.summary;
					$http({
						method : 'POST',
						url : baseURL+"/services/duosoftware.supportAPI/support/createTicket",
						headers: {
							'idToken': idToken,
							'Content-Type' : 'application/json',
							'domain': _domain
						},
						data: newTicketData
					})
					.then(function(successResponse) {
						if(successResponse.data.IsSuccess){
							notifications.toast(successResponse.data.CustomMessage, "Success");
							$timeout(function(){$scope.support ={};});
							$scope.submitOnProcess = false;
							$scope.getTicketsByUser();
						}
					}, function(errorResponse) {
						notifications.toast("Something went wrong. Please try again", "Error");
						$timeout(function(){$scope.support ={};});
						$scope.submitOnProcess = false;
					});
				}
			}, function(errorResponse) {
				notifications.toast("Something went wrong. Please try again", "Error");
				$timeout(function(){$scope.support ={};});
				$scope.submitOnProcess = false;
			});
		};
		/** Create new ticket - END */

		/** Get already added tickets */
		$scope.getTicketsByUser = function () {
			$scope.loadingTickets = true;
			$scope.getUserInfoByEmail(function (_id) {
				if(_id == null){
					$scope.registerNewUser(function (__id){
						if(__id != null){
							$http({
								method : 'GET',
								url : baseURL+"/services/duosoftware.supportAPI/support/getTicketsByUserId?id="+_id,
								headers: {
									'idToken': idToken,
									'domain': _domain
								}}).then(function(successResponse) {
								if(successResponse.data.IsSuccess){
									$scope.addedTickets = successResponse.data.Result;
									$scope.emptyTickets = false;
									$scope.loadingTickets = false;
								}else{
									$scope.emptyTickets = true;
									$scope.loadingTickets = false;
								}
							}, function(response) {
								$scope.emptyTickets = true;
								$timeout(function(){$scope.loadingTickets = false;});
							});
						}else{
							//notifications.toast("Something went wrong. Please try again", "Error");
							$scope.emptyTickets = true;
							$timeout(function(){$scope.loadingTickets = false;});
						}
					});
				}else{
					$http({
						method : 'GET',
						url : baseURL+"/services/duosoftware.supportAPI/support/getTicketsByUserId?id="+_id,
						headers: {
							'idToken': idToken,
							'domain': _domain
						}}).then(function(successResponse) {
						if(successResponse.data.Result.length != 0){
							$scope.addedTickets = successResponse.data.Result;
							$scope.emptyTickets = false;
							$scope.loadingTickets = false;
						}else{
							$scope.emptyTickets = true;
							$scope.loadingTickets = false;
						}
					}, function(response) {
						$scope.emptyTickets = true;
						$scope.loadingTickets = false;
					});
				}
			});
		};
		/** Get already added tickets - END */
		$scope.getTicketsByUser();

		/** Submit a new ticket */
		$scope.submitTicket = function () {
			$scope.submitOnProcess = true;
			if(userId == null){
				var _id = $scope.getUserInfoByEmail();
				if(_id == null){
					_id = $scope.registerNewUser();
					if(_id != null){
						$scope.createANewTicket();
					}else{
						notifications.toast("Something went wrong. Please try again", "Error");
						$scope.submitOnProcess = false;
					}
				}else{
					$scope.createANewTicket();
				}
			}else{
				$scope.createANewTicket();
			}
		};
		/** Submit a new ticket - END */
	}
})();
