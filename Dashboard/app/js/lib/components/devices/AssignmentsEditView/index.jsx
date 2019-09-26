/* eslint-disable import/no-unresolved */
import React from 'react';
import PropTypes from 'prop-types';

import FolderSurveySelectorView from 'akvo-flow/components/selectors/FolderSurveySelector';
import FormSelectorView from 'akvo-flow/components/selectors/FormSelector';
import DeviceGroupSelectorView from 'akvo-flow/components/selectors/DeviceSelector';
import AssignmentDetails from './AssignmentDetails';

export default class AssignmentsEditView extends React.Component {
  state = {
    assignmentName: this.props.inputValues.assignmentName,
    startDate: this.props.inputValues.startDate,
    expireDate: this.props.inputValues.toDate,
    nameValidationMsg: '',
  }

  // lifecycle methods
  componentDidMount() {
    this.validateAssignment(this.props.inputValues.assignmentName);
  }

  // event handlers
  onChangeState = (key, value) => {
    if (key === 'assignmentName') this.validateAssignment(value);
    this.setState({ [key]: value });
  }

  onSubmit = () => {
    const { assignmentName, startDate, expireDate } = this.state;
    if (this.assignmentNotComplete()) return;

    this.props.actions.onSubmit({ assignmentName, startDate, expireDate });
  }

  // helpers
  validateAssignment = (assignmentName) => {
    if ((assignmentName && assignmentName.length > 100) || !assignmentName || assignmentName == '') {
      if (assignmentName && assignmentName.length > 100) {
        this.setState({ nameValidationMsg: Ember.String.loc('_assignment_name_over_100_chars') });
      } else if (!assignmentName || assignmentName == '') {
        this.setState({ nameValidationMsg: Ember.String.loc('_assignment_name_not_set') });
      }
    } else {
      this.setState({ nameValidationMsg: '' });
    }
  }

  formatStateForComponents = () => {
    const assignmentDetailsState = {
      assignmentName: this.state.assignmentName,
      startDate: this.state.startDate,
      expireDate: this.state.expireDate,
    };

    return {
      assignmentDetailsState,
    };
  }

  assignmentNotComplete = () => {
    const { assignmentName, expireDate, startDate } = this.state;

    // if assignment name is empty
    if (assignmentName.length === 0) {
      FLOW.dialogControl.set('activeAction', 'ignore');
      FLOW.dialogControl.set('header', Ember.String.loc('_assignment_name_not_set'));
      FLOW.dialogControl.set('message', Ember.String.loc('_assignment_name_not_set_text'));
      FLOW.dialogControl.set('showCANCEL', false);
      FLOW.dialogControl.set('showDialog', true);
      return true;
    }

    // if start date or end date is falsy
    if (!expireDate.length || !startDate.length) {
      FLOW.dialogControl.set('activeAction', 'ignore');
      FLOW.dialogControl.set('header', Ember.String.loc('_date_not_set'));
      FLOW.dialogControl.set('message', Ember.String.loc('_date_not_set_text'));
      FLOW.dialogControl.set('showCANCEL', false);
      FLOW.dialogControl.set('showDialog', true);
      return true;
    }

    return false;
  }

  // render
  render() {
    const { strings, actions, data } = this.props;
    const { assignmentDetailsState } = this.formatStateForComponents();

    return (
      <div>
        <a
          onKeyPress={actions.cancelEditSurveyAssignment}
          onClick={actions.cancelEditSurveyAssignment}
          className="stepBack"
          id="float-right"
        >
          {strings.backToAssignmentList}
        </a>

        <form>
          <AssignmentDetails
            strings={{ ...strings, nameValidationMsg: this.state.nameValidationMsg }}
            values={assignmentDetailsState}
            onChange={this.onChangeState}
          />

          <div className="fieldSetWrap floats-in">
            <div className="formLeftPanel">
              <fieldset id="surveySelect" className="floats-in">
                <h2>
                  02.
                  {' '}
                  {strings.selectSurvey}
                  :
                </h2>
                <p className="infoText">{strings.cantFindYourSurvey}</p>

                <div className="SelectLayout">
                  <label htmlFor="surveyGroup">
                    {strings.selectSurvey}
                    :
                  </label>

                  <FolderSurveySelectorView />
                </div>

                <div className="formSelectorList">
                  <label htmlFor="surveys">
                    {strings.selectForms}
                    :
                  </label>

                  <FormSelectorView
                    forms={data.forms}
                    onCheck={actions.handleFormCheck}
                  />
                </div>
              </fieldset>
            </div>

            <div className="formRightPanel">
              <fieldset id="surveySelect" className="floats-in">
                <h2>
                  03.
                  {' '}
                  {strings.selectDevices}
                  :
                </h2>
                <label htmlFor="deviceGroup">{strings.selectDeviceGroup}</label>
                <DeviceGroupSelectorView />
              </fieldset>
            </div>
          </div>

          <div className="fieldSetWrap makeWhite">
            <div className="formLeftPanel" />
            <div className="formRightPanel">
              {/* Data points list will come here */}
            </div>
          </div>

          <div className="menuConfirm">
            <ul>
              {!this.state.nameValidationMsg.length ? (
                <li>
                  <a
                    onClick={this.onSubmit}
                    onKeyPress={this.onSubmit}
                    className="standardBtn"
                  >
                    {strings.saveAssignment}
                  </a>
                </li>
              ) : (
                <li><a className="button noChanges" id="standardBtn">{strings.saveAssignment}</a></li>
              )}
              <li>
                <a
                  onClick={actions.cancelEditSurveyAssignment}
                  onKeyPress={actions.cancelEditSurveyAssignment}
                >
                  {strings.cancel}
                </a>
              </li>
            </ul>
          </div>
        </form>
      </div>
    );
  }
}

AssignmentsEditView.propTypes = {
  strings: PropTypes.object.isRequired,
  actions: PropTypes.object.isRequired,
  inputValues: PropTypes.object.isRequired,
  data: PropTypes.object.isRequired,
};
