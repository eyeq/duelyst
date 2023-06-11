'use strict';

const Session = require('app/common/session2');
const validator = require('validator');
const Logger = require('app/common/logger');
const Animations = require('app/ui/views/animations');
const ChangeUsernameTmpl = require('app/ui/templates/item/change_username_dialog.hbs');
const i18next = require('i18next');
const moment = require('moment');
const ProfileManager = require('app/ui/managers/profile_manager');
const FormPromptDialogItemView = require('./util/form_prompt_dialog');

const ChangeUsernameItemView = FormPromptDialogItemView.extend({

  template: ChangeUsernameTmpl,

  id: 'app-change-username',

  ui: {
    $form: '.prompt-form',
    $submit: '.prompt-submit',
    $submitted: '.prompt-submitted',
    $error: '.prompt-error',
    $errorMessage: '.error-message',
    $success: '.prompt-success',

    $username: '.username',
  },

  events: {
    'click .prompt-submit': 'onClickSubmit',
    'click .prompt-cancel': 'onClickCancel',
    'input .form-control': 'onFormControlChangeContent',
    'blur .form-control': 'onFormControlBlur',

    'input .username': 'onUsernameInput',
  },

  templateHelpers: {

    canChangeUsernameThisMonth: function () {
      const updatedAt = this.model.get('username_updated_at') || 0;
      const then = moment(updatedAt);
      const duration = moment.duration(moment().utc().diff(then));
      return duration.asMonths() >= 1.0;
    },

    canChangeUsernameForFree: function () {
      return !this.model.get('username_updated_at');
    },
  },

  _usernameAvailable: false,

  // #region Event

  onUsernameInput: function () {
    this._usernameAvailable = false;
  },

  // #endregion

  // #region

  onSubmit: function (e) {
    FormPromptDialogItemView.prototype.onSubmit.apply(this, arguments);

    const username = this.ui.$username.val();
    Session.changeUsername(username).bind(this)
      .then(function (res) {
        this.onSuccess(res);
      })
      .catch(function (e) {
        // onError expects a string not an actual error
        this.onError(e.innerMessage || e.message);
      });
  },

  updateValidState: function () {
    const username = this.ui.$username.val();
    let isValid = true;

    // check username
    if (username == undefined || username.length === 0) {
      isValid = false;
    } else {
      if (!validator.isLength(username, 3, 18) || !validator.isAlphanumeric(username)) {
        isValid = false;
        this.showInvalidFormControl(this.ui.$username, i18next.t('registration.registration_validation_username_instructions'));
      } else if (username.toLowerCase() === ProfileManager.getInstance().profile.get('username').toLowerCase()) {
        isValid = false;
        this.showInvalidFormControl(this.ui.$username, i18next.t('profile.invalid_change_username_message'));
      } else {
        this.hideInvalidFormControl(this.ui.$username);

        if (!this._usernameAvailable) {
          Session.isUsernameAvailable(username)
            .then(function (available) {
              if (available) {
                this._usernameAvailable = true;
              } else {
                this.showInvalidFormControl(this.ui.$username, i18next.t('registration.registration_validation_username_exists'));
              }
            }.bind(this));
        }
      }
    }

    return isValid && this._usernameAvailable;
  },

  // #endregion
});

module.exports = ChangeUsernameItemView;
