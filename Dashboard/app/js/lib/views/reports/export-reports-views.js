/*global Ember, $, FLOW */

FLOW.ReportLoader = Ember.Object.create({
  criteria: null,
  timeout: 30000,
  requestInterval: 3000,

  payloads: {
	DATA_CLEANING: {
	  surveyId: '75201',
	  exportType: 'DATA_CLEANING',
	  opts: {
		exportMode: 'DATA_CLEANING',
		lastCollection: 'false',
	  }
	},
	DATA_ANALYSIS: {
	  surveyId: '75201',
	  exportType: 'DATA_ANALYSIS',
	  opts: {
		exportMode: 'DATA_ANALYSIS',
		lastCollection: 'false',
	  }
	},
    COMPREHENSIVE: {
      surveyId: '75201',
      exportType: 'COMPREHENSIVE',
      opts: {
        exportMode: 'COMPREHENSIVE',
      }
    },
    GEOSHAPE: {
      surveyId: '75201',
      exportType: 'GEOSHAPE',
      opts: {
        questionId: '12345'
      }
    },
    SURVEY_FORM: {
      surveyId: '75201',
      exportType: 'SURVEY_FORM',
      opts: {}
    }
  },

  load: function (exportType, surveyId, opts) {
    var criteria;

    if (this.get('criteria')) {
      return;
    }

    Ember.assert('exportType param is required', exportType !== undefined);
    Ember.assert('surveyId param is required', surveyId !== undefined);

    criteria = Ember.copy(this.get('payloads')[exportType]);
    criteria.surveyId = '' + surveyId;
    criteria.baseURL = location.protocol + '//' + location.host;

    criteria.opts.imgPrefix = FLOW.Env.photo_url_root;
    criteria.opts.uploadUrl = FLOW.Env.surveyuploadurl;
    criteria.opts.appId = FLOW.Env.appId;

    if (opts) {
      Ember.keys(opts).forEach(function (k) {
        criteria.opts[k] = opts[k];
      });
    }

    criteria.opts.email = FLOW.currentUser.email;
    criteria.opts.flowServices = FLOW.Env.flowServices;

    this.set('criteria', criteria);
    FLOW.savingMessageControl.numLoadingChange(1);
    this.requestReport();
  },

  requestReport: function () {
	this.set('processing', true);
	$.ajax({
	  url: FLOW.Env.flowServices + '/generate',
	  data: {
		criteria: JSON.stringify(this.get('criteria'))
	  },
	  jsonpCallback: 'FLOW.ReportLoader.handleResponse',
	  dataType: 'jsonp',
	  timeout: this.timeout
	});

	Ember.run.later(this, this.handleError, this.timeout);
  },

  handleResponse: function (resp) {
    if (!resp || resp.status !== 'OK') {
      FLOW.savingMessageControl.numLoadingChange(-1);
      this.showError();
      return;
    }
    if (resp.message === 'PROCESSING') {
      this.set('processing', false);
      this.showEmailNotification();
    } else if (resp.file && this.get('processing')) {
      FLOW.savingMessageControl.numLoadingChange(-1);
      this.set('processing', false);
      this.set('criteria', null);
      $('#downloader').attr('src', FLOW.Env.flowServices + '/report/' + resp.file);
    }
  },

  handleError: function () {
    if (this.get('processing')) {
      FLOW.savingMessageControl.numLoadingChange(-1);
      this.showError();
    }
  },

  showError: function () {
	  FLOW.savingMessageControl.numLoadingChange(-1);
    this.set('processing', false);
    this.set('criteria', null);
    FLOW.dialogControl.set('activeAction', 'ignore');
    FLOW.dialogControl.set('header', Ember.String.loc('_error_generating_report'));
    FLOW.dialogControl.set('message', Ember.String.loc('_error_generating_report_try_later'));
    FLOW.dialogControl.set('showCANCEL', false);
    FLOW.dialogControl.set('showDialog', true);
  },

  showEmailNotification: function () {
    FLOW.savingMessageControl.numLoadingChange(-1);
    this.set('processing', false);
    this.set('criteria', null);
    FLOW.dialogControl.set('activeAction', 'ignore');
    FLOW.dialogControl.set('header', Ember.String.loc('_your_report_is_being_prepared'));
    FLOW.dialogControl.set('message', Ember.String.loc('_we_will_notify_via_email'));
    FLOW.dialogControl.set('showCANCEL', false);
    FLOW.dialogControl.set('showDialog', true);
  }

});

FLOW.ExportReportsAppletView = FLOW.View.extend({
  showRawDataReportApplet: false,
  showComprehensiveReportApplet: false,
  showGoogleEarthFileApplet: false,
  showSurveyFormApplet: false,
  showComprehensiveDialog: false,
  showRawDataImportApplet: false,
  showGoogleEarthButton: false,
  reportFromDate: undefined,
  reportToDate: undefined,
  dateRangeDisabled: false,
  exportOption: "range",
  dateRangeText: Ember.String.loc('_collection_period'),
  onlyRecentText: Ember.String.loc('_only_recent_submissions'),
  tagName: 'li',
  classNames: 'trigger',

  dateRangeDisabledObserver: function () {
    this.set('dateRangeDisabled', this.get("exportOption") === "recent");
  }.observes('this.exportOption'),

  setMinDate: function () {
    if (this.get('reportFromDate')) {
      this.$(".to_date").datepicker("option", "minDate", this.get("reportFromDate"))
    }
  }.observes('this.reportFromDate'),

  setMaxDate: function () {
    if (this.get('reportToDate')) {
     this.$(".from_date").datepicker("option", "maxDate", this.get("reportToDate"))
    }
  }.observes('this.reportToDate'),

  didInsertElement: function () {
    FLOW.selectedControl.set('surveySelection', FLOW.SurveySelection.create());
    FLOW.selectedControl.set('selectedSurvey', null);
    FLOW.editControl.set('useQuestionId', false);
    FLOW.uploader.registerEvents();
  },

  selectedSurvey: function () {
    if (!Ember.none(FLOW.selectedControl.get('selectedSurvey')) && !Ember.none(FLOW.selectedControl.selectedSurvey.get('keyId'))){
      return FLOW.selectedControl.selectedSurvey.get('keyId');
    } else {
      return null;
    }
  }.property('FLOW.selectedControl.selectedSurvey'),

  selectedQuestion: function () {
    if (!Ember.none(FLOW.selectedControl.get('selectedQuestion'))
        && !Ember.none(FLOW.selectedControl.selectedQuestion.get('keyId'))){
      return FLOW.selectedControl.selectedQuestion.get('keyId');
    } else {
      return null;
    }
  }.property('FLOW.selectedControl.selectedQuestion'),

  hideLastCollection: function () {
    if (FLOW.selectedControl.selectedSurveyGroup && FLOW.selectedControl.selectedSurvey) {
      //if not a monitoring form, export should be filtered by date
      if (FLOW.selectedControl.selectedSurvey.get('keyId') == FLOW.selectedControl.selectedSurveyGroup.get('newLocaleSurveyId')) {
        $('input:radio[name=cleaning-export-option]').filter('[value=range]').prop('checked', true);
        $('input:radio[name=analysis-export-option]').filter('[value=range]').prop('checked', true);
      }
    }
    return !(FLOW.selectedControl.selectedSurveyGroup && FLOW.selectedControl.selectedSurveyGroup.get('monitoringGroup')
      && FLOW.selectedControl.selectedSurvey.get('keyId') != FLOW.selectedControl.selectedSurveyGroup.get('newLocaleSurveyId'));
  }.property('FLOW.selectedControl.selectedSurvey'),

  showDataCleaningReport: function () {
    var opts = {from:this.get("reportFromDate"), to:this.get("reportToDate"), lastCollection: this.get('exportOption') === "recent"};
    var sId = this.get('selectedSurvey');
    if (!sId) {
      this.showWarning();
      return;
    }
    FLOW.ReportLoader.load('DATA_CLEANING', sId, opts);
  },

  showDataAnalysisReport: function () {
    var opts = {from:this.get("reportFromDate"), to:this.get("reportToDate"), lastCollection: this.get('exportOption') === "recent"};
    var sId = this.get('selectedSurvey');
    if (!sId) {
      this.showWarning();
      return;
    }
    FLOW.ReportLoader.load('DATA_ANALYSIS', sId, opts);
  },

  showComprehensiveReport: function () {
    var opts = {}, sId = this.get('selectedSurvey');
    if (!sId) {
      this.showWarning();
      return;
    }
    FLOW.ReportLoader.load('COMPREHENSIVE', sId, opts);
  },

  showGeoshapeReport: function () {
    var sId = this.get('selectedSurvey');
    var qId = this.get('selectedQuestion');
    if (!sId || !qId) {
      this.showWarningMessage(
        Ember.String.loc('_export_data'),
        Ember.String.loc('_select_survey_and_geoshape_question_warning')
      );
      return;
    }
    FLOW.ReportLoader.load('GEOSHAPE', sId, {"questionId": qId});
  },

  showSurveyForm: function () {
	var sId = this.get('selectedSurvey');
    if (!sId) {
      this.showWarning();
      return;
    }
    FLOW.ReportLoader.load('SURVEY_FORM', sId);
  },

  importFile: function () {
    var file, sId = this.get('selectedSurvey');
    if (!sId) {
      this.showImportWarning(Ember.String.loc('_import_select_survey'));
      return;
    }

    file = $('#raw-data-import-file')[0];

    if (!file || file.files.length === 0) {
      this.showImportWarning(Ember.String.loc('_import_select_file'));
      return;
    }

    FLOW.uploader.addFile(file.files[0]);
    FLOW.uploader.upload();
  },

  showComprehensiveOptions: function () {
    var sId = this.get('selectedSurvey');
    if (!sId) {
      this.showWarning();
      return;
    }

    FLOW.editControl.set('summaryPerGeoArea', true);
    FLOW.editControl.set('omitCharts', false);
    this.set('showComprehensiveDialog', true);
  },

  showWarning: function () {
    this.showWarningMessage(Ember.String.loc('_export_data'), Ember.String.loc('_applet_select_survey'));
  },

  showImportWarning: function (msg) {
    this.showWarningMessage(Ember.String.loc('_import_clean_data'), msg);
  },

  showWarningMessage: function(header, message) {
    FLOW.dialogControl.set('activeAction', 'ignore');
    FLOW.dialogControl.set('header', header);
    FLOW.dialogControl.set('message', message);
    FLOW.dialogControl.set('showCANCEL', false);
    FLOW.dialogControl.set('showDialog', true);
  },

  eventManager: Ember.Object.create({
    click: function(event, clickedView){
      var exportTypes = ["dataCleanExp", "dataAnalyseExp", "compReportExp", "geoshapeSelect", "surveyFormExp"];
      if (exportTypes.indexOf(clickedView.get('export')) > -1) {
        var i, options, trigger;
        options = document.getElementsByClassName("options");
        for (i = 0; i < options.length; i++) {
          options[i].style.display = "none";
        }
        trigger = document.getElementsByClassName("trigger");
        for (i = 0; i < trigger.length; i++) {
          trigger[i].className = trigger[i].className.replace(" active", "");
        }
        document.getElementById(clickedView.get('export')).style.display = "block";
        event.currentTarget.className += " active";

        //by default select the range option
        if (clickedView.get('export') == "dataCleanExp") {
          if ($('input:radio[name=cleaning-export-option]').is(':checked') === false) {
            $('input:radio[name=cleaning-export-option]').filter('[value=range]').prop('checked', true);
          }
        } else if (clickedView.get('export') == "dataAnalyseExp") {
          if ($('input:radio[name=analysis-export-option]').is(':checked') === false) {
            $('input:radio[name=analysis-export-option]').filter('[value=range]').prop('checked', true);
          }
        }
      }
    }
  })
});
