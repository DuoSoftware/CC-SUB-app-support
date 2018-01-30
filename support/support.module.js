////////////////////////////////
// App : api
// Owner  : Kasun Wijeratne
// Last changed date : 2017/07/18
// Version : 6.1.0.1
// Modified By : Kasun
/////////////////////////////////


(function ()
{
    'use strict';

    angular
        .module('app.support', [])
        .config(config);

    /** @ngInject */
    function config($stateProvider, msNavigationServiceProvider, mesentitlementProvider)
    {
        mesentitlementProvider.setStateCheck("guide");

        $stateProvider
            .state('app.support', {
                url    : '/support',
                views  : {
                    'support@app': {
                        templateUrl: 'app/main/support/support.html',
                        controller : 'SupportController as vm'
                    }
                },
                resolve: {
                   security: ['$q','mesentitlement', function($q,mesentitlement){
                        var entitledStatesReturn = mesentitlement.stateDepResolver('support');

                        if(entitledStatesReturn !== true){
                              return $q.reject("unauthorized");
                        };
                    }]
                },
                bodyClass: 'support'
            });

        msNavigationServiceProvider.saveItem('support', {
            // title    : 'Support',
            state    : 'app.support',
            weight   : 11
        });
    }
})();
