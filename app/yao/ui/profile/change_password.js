const Session = require('app/common/session2');
const validator = require('validator');
const Logger = require('app/common/logger');
const i18next = require('i18next');
const ModalDialogViewYao = require('app/yao/ui/common/modal_dialog_view_yao');

const ChangePasswordItemView = ModalDialogViewYao.extend({

  id: 'app-change-password',
  template: require('app/yao/ui/profile/templates/change_password.hbs'),

  _transparent: true,

  ui: {
    $form: '.prompt-form',
    $submitted: '.prompt-submitted',
    $success: '.prompt-success',
    $error: '.prompt-error',
    $errorMessage: '.error-message',

    $passwordCurrent: '.password-current',
    $password: '.password',
    $passwordConfirm: '.password-confirm',
  },

  events: {
    'click .prompt-submit': 'onSubmit',
    'click .prompt-cancel': 'onCancel',
    'click .prompt-error-back': 'onErrorBack',

    'blur .form-control': 'onFormControlBlur',
  },

  onFormControlBlur(event) {
    const $target = $(event.target);
    if (this.ui.$passwordCurrent.is($target)) {
      if (this.updateValidStateCurrentPassword()) {
        this.updateValidStateSame();
      }
    } else if (this.ui.$password.is($target) || this.ui.$passwordConfirm.is($target)) {
      if (this.updateValidStatePassword()) {
        this.updateValidStateSame();
      }
    }
  },

  submit() {
    const passwordCurrent = this.ui.$passwordCurrent.val();
    const password = this.ui.$password.val();

    this.lockTriggeredNavigation();
    Session.changePassword(passwordCurrent, password).bind(this)
      .then(function (res) {
        this.onSuccess(res);
      })
      .catch(function (e) {
        // onError expects a string not an actual error
        this.onError(e.innerMessage || e.message);
      });
  },

  onSuccessComplete(res) {
    this.unlockTriggeredNavigation();
    this.destroyView();
  },

  onErrorComplete() {
    this.unlockTriggeredNavigation();
  },

  updateValidState() {
    let isValid = ModalDialogViewYao.prototype.updateValidState.apply(this, arguments);

    if (isValid) {
      isValid = this.updateValidStateCurrentPassword();
    }
    if (isValid) {
      isValid = this.updateValidStatePassword();
    }
    if (isValid) {
      isValid = this.updateValidStateSame();
    }
    return isValid;
  },

  updateValidStateCurrentPassword() {
    const passwordCurrent = this.ui.$passwordCurrent.val();

    let isValid = true;
    if (!validator.isLength(passwordCurrent, 8)) {
      this.showInvalidFormControl(this.ui.$passwordCurrent, passwordCurrent.length === 0 ? '' : i18next.t('registration.change_password_validation_current_password'));
      isValid = false;
    } else {
      this.hideInvalidFormControl(this.ui.$passwordCurrent);
    }
    return isValid;
  },

  updateValidStatePassword() {
    const password = this.ui.$password.val();
    const passwordConfirm = this.ui.$passwordConfirm.val();

    let isValid = true;
    if (!validator.isLength(password, 8)) {
      this.showInvalidFormControl(this.ui.$password, password.length === 0 ? '' : i18next.t('registration.registration_validation_password_instructions'));
      this.hideInvalidFormControl(this.ui.$passwordConfirm);
      isValid = false;
    } else if (!validator.equals(password, passwordConfirm)) {
      this.hideInvalidFormControl(this.ui.$password);
      this.showInvalidFormControl(this.ui.$passwordConfirm, passwordConfirm.length === 0 ? '' : i18next.t('registration.registration_validation_passwords_dont_match'));
      isValid = false;
    } else {
      this.hideInvalidFormControl(this.ui.$password);
      this.hideInvalidFormControl(this.ui.$passwordConfirm);
    }
    return isValid;
  },

  updateValidStateSame() {
    const passwordCurrent = this.ui.$passwordCurrent.val();
    const password = this.ui.$password.val();

    let isValid = true;
    if (validator.equals(passwordCurrent, password)) {
      this.showInvalidFormControl(this.ui.$password, i18next.t('registration.change_password_validation_password_dont_change'));
      isValid = false;
    }
    return isValid;
  },

});

module.exports = ChangePasswordItemView;
