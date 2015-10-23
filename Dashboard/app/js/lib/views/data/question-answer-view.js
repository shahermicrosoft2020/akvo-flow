// this function is also present in assignment-edit-views.js, we need to consolidate using moment.js

function formatDate(date) {
  if (date && !isNaN(date.getTime())) {
    return date.getFullYear() + "/" + (date.getMonth() + 1) + "/" + date.getDate();
  } else return null;
}


FLOW.QuestionAnswerView = Ember.View.extend({

  isTextType: function(){
    return this.get('questionType') === 'FREE_TEXT';
  }.property('this.questionType'),

  isCascadeType: function(){
    return this.get('questionType') === 'CASCADE';
  }.property('this.questionType'),

  isOptionType: function(){
    return this.get('questionType') === 'OPTION';
  }.property('this.questionType'),

  isNumberType: function(){
    return this.get('questionType') === 'NUMBER';
  }.property('this.questionType'),

  isBarcodeType: function(){
    return this.get('questionType') === 'SCAN';
  }.property('this.questionType'),

  isDateType: function(){
    return this.get('questionType') === 'DATE';
  }.property('this.questionType'),

  isPhotoType: function(){
    return this.get('questionType') === 'PHOTO';
  }.property('this.questionType'),

  isVideoType: function(){
    return this.get('questionType') === 'VIDEO';
  }.property('this.questionType'),

  optionsList: function(){
    var c = this.content;
    if (Ember.none(c)) {
      return [];
    }

    var questionId = c.get('questionID');

    var options = FLOW.store.filter(FLOW.QuestionOption, function (item) {
      return item.get('questionId') === +questionId;
    });

    optionArray = options.toArray();
    optionArray.sort(function (a, b) {
        return a.get('order') - b.get('order');
    });

    tempList = [];
    optionArray.forEach(function (item) {
      tempList.push(item.get('text'));
    });
    return tempList;
  }.property('this.content'),

  content: null,

  inEditMode: false,

  isNotEditable: function(){
    var type = this.get('questionType');
    return (type == 'GEO' || type == 'PHOTO' || type == 'VIDEO' || type == 'GEOSHAPE');
  }.property('this.questionType'),

  date: null,

  numberValue: null,

  cascadeValue: function(key, value, previousValue){
    var c = this.content;
    // setter
    if (arguments.length > 1) {
      // split according to pipes
      var cascadeNames = value.split("|");
      var cascadeResponse = [];
      var obj = null;
      cascadeNames.forEach(function(item){
        if (item.trim().length > 0) {
          obj = {};
          obj.name = item.trim();
          cascadeResponse.push(obj);
        }
      });

      c.set('value', JSON.stringify(cascadeResponse));
    }

    // getter
    var cascadeString = "", cascadeJson;
    if (c && c.get('value')) {
      if (c.get('value').indexOf("|") > -1) {
        cascadeString += c.get('value');
      } else {
        cascadeJson = JSON.parse(c.get('value'));
        cascadeString = cascadeJson.map(function(item){
          return item.name;
        }).join("|");
      }
      return cascadeString;
    }
    return null;
  }.property('this.content'),

  photoUrl: function(){
    var c = this.content;
    if (!Ember.empty(c.get('value'))) {
      return FLOW.Env.photo_url_root + c.get('value').split('/').pop();
    }
  }.property('this.content,this.isPhotoType,this.isVideoType'),

  questionType: function(){
    if(this.get('question')){
      return this.get('question').get('type');
    }
  }.property('this.question'),

  question: function(){
    var c = this.get('content');
    if (c) {
      var questionId = c.get('questionID');
      var q = FLOW.questionControl.findProperty('keyId', +questionId);
      return q;
    }
  }.property('FLOW.questionControl.content'),

  init: function () {
    this._super();
  },

  doEdit: function () {
    this.set('inEditMode', true);
    var c = this.content;

    if (this.get('isDateType') && !Ember.empty(c.get('value'))) {
      var d = new Date(+c.get('value')); // need to coerce c.get('value') due to milliseconds
      this.set('date', formatDate(d));
    }

    if (this.get('isNumberType') && !Ember.empty(c.get('value'))) {
      this.set('numberValue', c.get('value'));
    }
  },

  doCancel: function () {
    this.set('inEditMode', false);
  },

  doSave: function () {

    if (this.get('isDateType')) {
      var d = Date.parse(this.get('date'));
      if (isNaN(d) || d < 0) {
        this.content.set('value', null);
      } else {
        this.content.set('value', d);
      }
    }

    if (this.get('isNumberType')) {
      if (isNaN(this.numberValue)) {
        this.content.set('value', null);
      } else {
        this.content.set('value', this.numberValue);
      }
    }
    FLOW.store.commit();
    this.set('inEditMode', false);

  },

  doValidateNumber: function () {
    // TODO should check for minus sign and decimal point, depending on question setting
    this.set('numberValue', this.get('numberValue').toString().replace(/[^\d.]/g, ""));
  }.observes('this.numberValue')
});

FLOW.QuestionAnswerInspectDataView = FLOW.QuestionAnswerView.extend({
  templateName: 'navData/question-answer',
});
