'use strict';

var EE = require('eventemitter3');

class Socket extends EE {
    constructor() {
        super();
        this.client = null;
        this.seqId = 1;
        this.seqMap = new Map();
    }

    getSeqId() {
        return this.seqId++;
    }

    request(cmd, args, cb) {
        const seqId = this.getSeqId();
        let payload;
        if (typeof args === 'function') {
            payload = {seqId: seqId};
            cb = args;
        } else {
            payload = {args: args, seqId: seqId};
        }
        payload.cmd = cmd;
        this.client.emit('cmd', payload);
        this.seqMap.set(seqId, cb);
    }

    connect(hostname) {
        this.client = io('ws://' + hostname + ':3000', {
            perMessageDeflate: false
        });

        this.client.on('connect', this.onConnect.bind(this));
        this.client.on('hello', this.onServerHello.bind(this));
        this.client.on('ready', this.onReady.bind(this));
        this.client.on('connect_error', this.onConnectError.bind(this));
    }

    register(username, cb) {
        this.request('register', {name: username}, (err, resp) => {
            cb(err, resp);
        });
    }

    listUsers(cb) {
        this.request('ls', (err, resp) => {
            cb(err, resp);
        });
    }

    onConnect() {
        console.log('connected to server! waiting for server message.');
        this.emit('connected');
    }

    onServerHello(data) {
        console.log('recieved server hello message: %s', data.message);
        this.emit('hello');
    }

    onConnectError() {
        this.client.close();
        console.log('failed to connect to server' + data);
        this.emit('error');
    }

    onReady(data) {
        console.log('server callback. seqId: ', data.seqId);
        const cb = this.seqMap.get(data.seqId);
        cb(data.error, data.response);
        this.seqMap.delete(data.seqId);
    }
}

var hfApp = angular.module('hfApp', ['ngRoute']);

hfApp.config(['$routeProvider', '$locationProvider', function($routeProvider, $locationProvider) {
    $routeProvider
    .when('/', {
        templateUrl: 'loading.html',
        controller: 'LoadingController'
    })
    .when('/register', {
        templateUrl: 'register.html',
        controller: 'RegisterController'
    })
    .when('/list', {
        templateUrl: 'list.html',
        controller: 'ListUsersController'
    });
}]);

hfApp.controller('LoadingController', ['$scope', '$location', 'socket', ($scope, $location, socket) => {
    $scope.master = {};

    $scope.connect = function connect(hostname) {
        console.log('connect to: ' + hostname);
        socket.connect(hostname);
    };

    socket.on('hello', () => {
        $location.path('/register');
        $scope.$apply();
    });
}]);

hfApp.controller('RegisterController', ['$scope', '$location', 'socket', ($scope, $location, socket) => {
    $scope.register = function register(username) {
        console.log('register as: ' + username);
        socket.register(username, (err, message) => {
            if (!err) {
                console.log('get server ready message:' + message);
                $location.path('/list');
                $scope.$apply();
            } else {
                console.error(err);
            }
        });
    };
}]);

hfApp.controller('ListUsersController', ['$scope', 'socket', function($scope, socket) {
    socket.listUsers((err, users) => {
        $scope.onUserUpdated(users);
    });

    $scope.onUserUpdated = function onUserUpdated(users) {
        $scope.users = users;
        $scope.$apply();
    };
}]);

hfApp.factory('socket', function() {
    return new Socket();
});
