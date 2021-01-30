

var app = angular.module('easymaintenance', ['ngRoute', 'ngStorage']);

var loginController = app.controller('auditController', function ($scope, $http, $rootScope, $location, $window, ServiceProcessor, fileUploadService, PageNavigatorService, DataTransferService, DownloadTransferService) {
    $scope.uploadFile = function () {
        $scope.expenditureList = [];
        var file = $scope.myFile;
        // var uploadUrl = "http://34.69.67.123:8301/maintenance";
        // var uploadUrl = "https://localhost:8443/maintenance";
        var uploadUrl = "https://8301-a7a3f92c-d01e-479a-a4c8-6e20bfba7405.asia-southeast1.cloudshell.dev/maintenance";
        var promise = fileUploadService.uploadFileToUrl(file, uploadUrl);
        promise.then(function (response) {
            let calculationResponse = response.calculationResponse;
            $scope.calculationResponse = calculationResponse;
            let expenseNameToExpenseDetails = calculationResponse.expenseNameToExpenseDetails;
            for (const [expenseName, expenditure] of Object.entries(expenseNameToExpenseDetails)) {
                $scope.expenditureList.push(expenditure);
            }
            DataTransferService.set(calculationResponse);
        }, function () {
            $scope.serverResponse = 'An error has occurred';
        });
    };


    if ($location.url() == "/generateReport") {
        $scope.downloadFileLink = "";
        // var uploadUrl = "http://34.69.67.123:8301/report";
        // var uploadUrl = "https://localhost:8443/report";
        var uploadUrl = "https://8301-a7a3f92c-d01e-479a-a4c8-6e20bfba7405.asia-southeast1.cloudshell.dev/report";
        let calculationResponse = DataTransferService.get();
        DataTransferService.set(null);
        var promise = ServiceProcessor.invoke('POST', uploadUrl, calculationResponse);
        promise.then(function (response) {
            $scope.calculationResponse = response.data;
            $scope.finalCalculationList = $scope.calculationResponse.finalCalculationList;
            $scope.downloadFileLink = response.data.maintenanceReportFileLink;
            DownloadTransferService.set($scope.calculationResponse);
        }, function () {
            $scope.serverResponse = 'An error has occurred';
        });
    }

    if ($location.url() == "/downloadReport") {
        let fileName = "maintenance-report.xlsx";
        // var uploadUrl = "http://34.69.67.123:8301/" + fileName;
        // var uploadUrl = "https://ocalhost:8443/" + fileName;
        var uploadUrl = "https://8301-a7a3f92c-d01e-479a-a4c8-6e20bfba7405.asia-southeast1.cloudshell.dev/" + fileName;
        let calculationResponse = DownloadTransferService.get();
        DownloadTransferService.set(null);
        var promise = ServiceProcessor.invoke('POST', uploadUrl, calculationResponse);
        promise.then(function (response) {
            var downloadloadUrl = response.data.fileDownloadUri;
            ServiceProcessor.invoke('GET', downloadloadUrl);
        }, function () {
            $scope.serverResponse = 'An error has occurred';
        });
    }

});

app.service('fileUploadService', function ($http, $q) {
    this.uploadFileToUrl = function (file, uploadUrl) {
        //FormData, object of key/value pair for form fields and values
        var fileFormData = new FormData();
        fileFormData.append('file', file);

        var deffered = $q.defer();
        $http.post(uploadUrl, fileFormData, {
            transformRequest: angular.identity,
            headers: { 'Content-Type': undefined }

        }).success(function (response) {
            deffered.resolve(response);

        }).error(function (response) {
            deffered.reject(response);
        });

        return deffered.promise;
    }
});

app.directive('demoFileModel', function ($parse) {
    return {
        restrict: 'A', //the directive can be used as an attribute only

        /*
         link is a function that defines functionality of directive
         scope: scope associated with the element
         element: element on which this directive used
         attrs: key value pair of element attributes
         */
        link: function (scope, element, attrs) {
            var model = $parse(attrs.demoFileModel),
                modelSetter = model.assign; //define a setter for demoFileModel

            //Bind change event on the element
            element.bind('change', function () {
                //Call apply on scope, it checks for value changes and reflect them on UI
                scope.$apply(function () {
                    //set the model value
                    modelSetter(scope, element[0].files[0]);
                });
            });
        }
    };
});

app.config(function ($routeProvider, $locationProvider) {
    $routeProvider
        .when('/index.html', {
            templateUrl: '/about.html',
            controller: 'auditController'
        }).when('/about', {
            templateUrl: '/about.html',
            controller: 'auditController'
        }).when('/upload', {
            templateUrl: '/expenditure.html',
            controller: 'auditController'
        }).when('/generateReport', {
            templateUrl: '/result.html',
            controller: 'auditController'
        }).when('/downloadReport', {
            templateUrl: '/result.html',
            controller: 'auditController'
        });
    $locationProvider.html5Mode(true);
    $locationProvider.hashPrefix('');
});

app.service('PageNavigatorService', function () {
    let goto = function (link) {
        let a = document.createElement('a')
        a.href = link;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    }
    return {
        goto: goto
    };
});

app.factory('NavAlertFactory', function () {
    var navAlertFactory = {};
    navAlertFactory.alertForNavAway = function (scope, allowedPath) {
        scope.$on("$locationChangeStart", function (event, next, current) {
            var path = next.substring(next.lastIndexOf("/"));
            var currentPath = current.substring(current.lastIndexOf("/"));
            if (currentPath == "/register" && path != allowedPath) {
                if (!confirm("Are you sure you want to navigate away from this page?")) {
                    event.preventDefault();
                }
            }
        });
    }
    return navAlertFactory;
});

app.service('NavAlertService', function (NavAlertFactory) {
    var scope1;
    this.setScope = function (scope) {
        scope1 = scope;
    }
    this.getScope = function () {
        return scope1;
    }
    this.raiseNavALert = function (allowedPath) {
        NavAlertFactory.alertForNavAway(scope1, allowedPath);
    }
});

app.service('ServiceProcessor', function ($http) {
    return {
        invoke: function (httpMethod, requestUrl, requestData) {
            return $http({
                method: httpMethod,
                url: requestUrl,
                data: requestData
            });
        }
    };
});




app.service('DataTransferService', function () {
    var data = {};
    function set(reqData) {
        data = reqData;
    }

    function get() {
        return data;
    }

    return {
        set: set,
        get: get
    }
});

app.service('DownloadTransferService', function () {
    var data = {};
    function set(reqData) {
        data = reqData;
    }

    function get() {
        return data;
    }

    return {
        set: set,
        get: get
    }
});


