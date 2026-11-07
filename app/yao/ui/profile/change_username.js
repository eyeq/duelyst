const Session = require('app/common/session2');
const validator = require('validator');
const Logger = require('app/common/logger');
const moment = require('moment');
const i18next = require('i18next');
const ProfileManager = require('app/ui/managers/profile_manager');
const ModalDialogViewYao = require('app/yao/ui/common/modal_dialog_view_yao');

const ChangeUsernameItemView = ModalDialogViewYao.extend({

  id: 'app-change-username',
  template: require('app/yao/ui/profile/templates/change_username.hbs'),

  _transparent: true,

  ui: {
    $form: '.prompt-form',
    $submitted: '.prompt-submitted',
    $success: '.prompt-success',
    $error: '.prompt-error',
    $errorMessage: '.error-message',

    $username: '.username',
  },

  events: {
    'click .prompt-submit': 'onSubmit',
    'click .prompt-cancel': 'onCancel',
    'click .prompt-error-back': 'onErrorBack',

    'blur .form-control': 'onFormControlBlur',
  },

  templateHelpers: {
    canChangeUsernameThisMonth() {
      const updatedAt = this.model.get('username_updated_at') || 0;
      const then = moment(updatedAt);
      const duration = moment.duration(moment().utc().diff(then));
      return duration.asMonths() >= 1.0;
    },

    canChangeUsernameForFree() {
      return !this.model.get('username_updated_at');
    },
  },

  onFormControlBlur(event) {
    const $target = $(event.target);
    if (this.ui.$username.is($target)) {
      this.updateValidState();
    }
  },

  submit() {
    const username = this.ui.$username.val();

    this.lockTriggeredNavigation();
    Session.changeUsername(username)
      .bind(this)
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

    const username = this.ui.$username.val();
    if (isValid) {
      if (!validator.isLength(username, 3, 18) || !validator.isAlphanumeric(username)) {
        this.showInvalidFormControl(this.ui.$username, i18next.t('registration.registration_validation_username_instructions'));
        isValid = false;
      } else if (username === ProfileManager.getInstance().profile.get('username')) {
        this.showInvalidFormControl(this.ui.$username, i18next.t('registration.change_username_validation_username_dont_change'));
        isValid = false;
      } else {
        this.hideInvalidFormControl(this.ui.$username);
        this.sendIsUsernameAvailable();
      }
    }
    return isValid;
  },

  sendIsUsernameAvailable() {
    const username = this.ui.$username.val();

    Session.isUsernameAvailable(username)
      .then((available) => {
        if (!available) {
          this.showInvalidFormControl(this.ui.$username, i18next.t('registration.registration_validation_username_exists'));
        }
      });
  },
});

module.exports = ChangeUsernameItemView;
