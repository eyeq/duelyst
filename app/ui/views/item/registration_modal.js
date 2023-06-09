'use strict';

const Promise = require('bluebird');
const Analytics = require('app/common/analytics');
const validator = require('validator');
const Session = require('app/common/session2');
const RegistrationItemViewTempl = require('app/ui/templates/item/registration_modal.hbs');
const NavigationManager = require('app/ui/managers/navigation_manager');
const i18next = require('i18next');
const FormPromptModalItemView = require('./util/form_prompt_modal');

const RegistrationItemView = FormPromptModalItemView.extend({

  id: 'app-registration',
  template: RegistrationItemViewTempl,

  ui: {
    $form: '.prompt-form',
    $submit: '.prompt-submit',
    $submitted: '.prompt-submitted',
    $error: '.prompt-error',
    $errorMessage: '.error-message',
    $success: '.prompt-success',

    $username: '.username',
    $password: '.password',
    $passwordConfirm: '.password-confirm',
  },

  events: {
    'click .prompt-submit': 'onClickSubmit',
    'click .prompt-cancel': 'onClickCancel',
    'input .form-control': 'onFormControlChangeContent',
    'blur .form-control': 'onFormControlBlur',

    'input .username': 'onUsernameInput',
  },

  _usernameAvailable: false,
  _userNavLockId: 'RegistrationUserNavLockId',

  // #region Backbone

  onRender: function () {
    FormPromptModalItemView.prototype.onRender.apply(this, arguments);
  },

  onShow: function () {
    FormPromptModalItemView.prototype.onShow.apply(this, arguments);
    Analytics.page('Registration', { path: '/#registration' });
  },

  // #endregion

  // #region Event

  onUsernameInput: function () {
    this._usernameAvailable = false;
  },

  // #endregion

  // #region

  updateValidState: function () {
    const username = this.ui.$username.val();
    const password = this.ui.$password.val();
    const passwordConfirm = this.ui.$passwordConfirm.val();
    let isValid = true;

    // check username
    if (username.length === 0) {
      isValid = false;
    } else {
      if (!validator.isLength(username, 3, 18) || !validator.isAlphanumeric(username)) {
        isValid = false;
        this.showInvalidFormControl(this.ui.$username, i18next.t('registration.registration_validation_username_instructions'));
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

    // check password
    if (password.length === 0) {
      isValid = false;
    } else {
      if (!validator.isLength(password, 8)) {
        isValid = false;
        this.showInvalidFormControl(this.ui.$password, i18next.t('registration.registration_validation_password_instructions'));
      } else {
        this.hideInvalidFormControl(this.ui.$password);

        // check password confirm
        if (passwordConfirm.length === 0) {
          isValid = false;
        } else {
          if (!validator.equals(password, passwordConfirm)) {
            isValid = false;
            this.showInvalidFormControl(this.ui.$passwordConfirm, i18next.t('registration.registration_validation_passwords_dont_match'));
          } else {
            this.hideInvalidFormControl(this.ui.$passwordConfirm);
          }
        }
      }
    }

    return isValid && this._usernameAvailable;
  },

  onSubmit: function () {
    FormPromptModalItemView.prototype.onSubmit.apply(this, arguments);

    // register
    const username = this.ui.$username.val().trim();
    const password = this.ui.$password.val().trim();

    Session.register({
      username: username,
      password: password,
      keycode: undefined,
      friend_referral_code: undefined,
      captcha: undefined,
    })
      .bind(this)
      .then(function (res) {
        this.onSuccess(res);
      })
      .catch(function (e) {
        // onError expects a string not an actual error
        this.onError(e.innerMessage || e.message);
      });
  },

  onSuccessComplete: function (registration) {
    FormPromptModalItemView.prototype.onSuccessComplete.apply(this, arguments);

    // lockdown user triggered navigation while we login
    NavigationManager.getInstance().requestUserTriggeredNavigationLocked(this._userNavLockId);

    // log user in
    Session.login(registration.username, registration.password)
      .finally(function () {
        // unlock user triggered navigation
        NavigationManager.getInstance().requestUserTriggeredNavigationUnlocked(this._userNavLockId);
      }.bind(this));
  },

  onErrorComplete: function (errorMessage) {
    FormPromptModalItemView.prototype.onErrorComplete.apply(this, arguments);

    // try to force showing invalid input
    if (/username/i.test(errorMessage)) {
      this.showInvalidFormControl(this.ui.$username, errorMessage);
    } else if (/password/i.test(errorMessage)) {
      this.showInvalidFormControl(this.ui.$password, errorMessage);
    }
  },

  // #endregion
});

module.exports = RegistrationItemView;
