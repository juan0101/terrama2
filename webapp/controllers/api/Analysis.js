"use strict";

var logger = require("./../../core/Logger");
var DataManager = require("../../core/DataManager.js");
var Utils = require('./../../core/Utils');
var TokenCode = require('./../../core/Enums').TokenCode;
var AnalysisError = require("./../../core/Exceptions").AnalysisError;
var AnalysisFacade = require("./../../core/facade/Analysis");

module.exports = function(app) {
  return {
    get: function(request, response) {
      var analysisId = request.params.id;
      var restriction = analysisId ? {id: analysisId} : {};
      restriction.project_id = app.locals.activeProject.id;

      AnalysisFacade.list(restriction).then(function(analysis) {
        return response.json(analysis);
      }).catch(function(err) {
        response.status(400);
        response.json({status: 400, message: err.message});
      });
    },

    post: function(request, response) {
      var analysisObject = request.body.analysis;
      var storager = request.body.storager;
      var scheduleObject = request.body.schedule;
      var shouldRun = request.body.run;

      return AnalysisFacade.save(analysisObject, storager, scheduleObject, app.locals.activeProject.id, shouldRun)
        .then(function(analysisResult) {
          var token = Utils.generateToken(app, TokenCode.SAVE, analysisResult.name);

          return response.json({status: 200, result: analysisResult.toObject(), token: token});
        }).catch(function(err) {
          logger.error(Utils.format("Could not save analysis %s", err.toString()));
          Utils.handleRequestError(response, err, 400);
        });
    },

    put: function(request, response) {
      var analysisId = request.params.id;

      if (analysisId) {
        var analysisObject = request.body.analysis;
        var scheduleObject = request.body.schedule;
        var storager = request.body.storager;
        var shouldRun = request.body.run;

        return AnalysisFacade
          .update(parseInt(analysisId), app.locals.activeProject.id, analysisObject, scheduleObject, storager, shouldRun)
          .then(function(analysisInstance) {
            // generating token
            var token = Utils.generateToken(app, TokenCode.UPDATE, analysisInstance.name);
            response.json({status: 200, result: analysisInstance.toObject(), token: token});
          }).catch(function(err) {
            logger.error(Utils.format("%s %s", "Error while retrieving updated analysis", err.toString()));
            Utils.handleRequestError(response, err, 400);
          });
      } else {
        Utils.handleRequestError(response, new AnalysisError("Missing analysis id"), 400);
      }
    },

    delete: function(request, response) {
      var id = request.params.id;
      if(id) {
        AnalysisFacade.delete(parseInt(id), app.locals.activeProject.id).then(function(analysis) {
          return response.json({status: 200, name: analysis.name});
        }).catch(function(err) {
          Utils.handleRequestError(response, err, 400);
        });
      } else {
        Utils.handleRequestError(response, new AnalysisError("Missing analysis id"), 400);
      }
    }
  };
};
