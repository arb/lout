// Load modules

var Lab = require('lab');
var Hapi = require('hapi');


// Declare internals

var internals = {};


// Test shortcuts

var expect = Lab.expect;
var before = Lab.before;
var after = Lab.after;
var describe = Lab.experiment;
var it = Lab.test;
var S = Hapi.types.String;


describe('Lout', function () {

    var routeTemplate = '{{#each routes}}{{this.method}}|{{/each}}';
    var indexTemplate = '{{#each routes}}{{this.path}}|{{/each}}';

    var server = null;
    before(function (done) {

        server = new Hapi.Server();

        var handler = function (request) {

            request.reply('ok');
        };

        server.route([
            { method: 'GET', path: '/test', config: { handler: handler, validate: { query: { param1: S().required() } } } },
            { method: 'POST', path: '/test', config: { handler: handler, validate: { query: { param2: S().valid('first', 'last') } } } },
            { method: 'GET', path: '/notincluded', config: { handler: handler, plugins: { lout: false } } }
        ]);

        server.plugin.require('../', { routeTemplate: routeTemplate, indexTemplate: indexTemplate }, function () {

            done();
        });
    });

    it('shows template when correct path is provided', function (done) {

        server.inject({ method: 'get', url: '/docs?path=/test' }, function (res) {

            expect(res.result).to.equal('GET|POST|');
            done();
        });
    });

    it('returns a Not Found response when wrong path is provided', function (done) {

        server.inject({ method: 'get', url: '/docs?path=blah' }, function (res) {

            expect(res.result.error).to.equal('Not Found');
            done();
        });
    });

    it('displays the index if no path is provided', function (done) {

        server.inject({ method: 'get', url: '/docs' }, function (res) {

            expect(res.result).to.equal('/test|/test|');
            done();
        });
    });

    it('index does\'t have the docs endpoint listed', function (done) {

        server.inject({ method: 'get', url: '/docs' }, function (res) {

            expect(res.result).to.not.contain('/docs');
            done();
        });
    });

    it('index does\'t include routes that are configured with docs disabled', function (done) {

        server.inject({ method: 'get', url: '/docs' }, function (res) {

            expect(res.result).to.not.contain('/notincluded');
            done();
        });
    });

    describe('Index', function () {

        it('doesn\'t throw an error when requesting the index when there are no POST routes', function (done) {

            var server = new Hapi.Server();
            server.route({ method: 'GET', path: '/test', config: { handler: function (request) { request.reply('ok'); }, validate: { query: { param1: S().required() } } } });

            server.plugin.require('../', function () {

                server.inject({
                    method: 'get',
                    url: '/docs'
                }, function (res) {

                    expect(res).to.exist;
                    expect(res.result).to.contain('/test');
                    done();
                });
            });
        });
    });
});