const Session = require('app/common/session2');
const Logger = require('app/common/logger');
const EVENTS = require('app/common/event_types');
const CONFIG = require('app/common/config');
const RSX = require('app/data/resources');
const audio_engine = require('app/audio/audio_engine');
const validator = require('validator');
const NavigationManager = require('app/ui/managers/navigation_manager');
const i18next = require('i18next');
const RegistrationItemView = require('app/ui/views/item/registration');
const ErrorDialogItemView = require('app/ui/views/item/error_dialog');
const ItemViewYao = require('app/yao/ui/common/item_view_yao');

const LoginMenuItemView = ItemViewYao.extend({

  id: 'app-login',
  template: require('app/yao/ui/login/templates/login_menu.hbs'),

  /* ui selector cache */
  ui: {
    $input: 'input',
    $login: '.login',
    $loginForm: '.login-form',
    $registration: '.registration',
    $username: '.login-username',
    $password: '.login-password',
  },

  /* Ui events hash */
  events: {
    'click .login': 'onLogin',
    'click .registration': 'onShowRegistration',
  },

  /* region EVENTS */

  onBeforeRender() {
    ItemViewYao.prototype.onBeforeRender.apply(this, arguments);
  },

  onRender() {
    ItemViewYao.prototype.onRender.apply(this, arguments);

    this.enableForm();
  },

  onShow() {
    // login when focused on input and triggering confirm
    this.listenTo(NavigationManager.getInstance(), EVENTS.user_triggered_confirm, function () {
      if (this.ui.$input.is(this.$el.find('input:focus'))) {
        this.onLogin();
      }
    });
  },

  onDestroy() {
    ItemViewYao.prototype.onDestroy.apply(this, arguments);
  },

  /* endregion EVENTS */

  /* region LOGIN */

  onLogin() {
    const username = this.ui.$username.val();
    const password = this.ui.$password.val();

    const isValid = this.updateValidState();
    if (isValid) {
      this.disableForm();

      audio_engine.current().play_effect_for_interaction(RSX.sfx_ui_confirm.audio, CONFIG.CONFIRM_SFX_PRIORITY);
      this._login(username, password);
    } else {
      audio_engine.current().play_effect_for_interaction(RSX.sfx_ui_error.audio, CONFIG.ERROR_SFX_PRIORITY);
    }
  },

  _login(username, password) {
    this.lockTriggeredNavigation();
    Session.login(username, password)
      .bind(this)
      .catch(function (e) {
        // onError expects a string not an actual error
        this.onError(e.codeMessage || e.innerMessage || e.message);
      })
      .finally(function () {
        this.unlockTriggeredNavigation();
      });
  },

  updateValidState() {
    const username = this.ui.$username.val();
    const password = this.ui.$password.val();
    let isValid = true;

    // check username
    if ((!validator.isLength(username, 3, 18) || !validator.isAlphanumeric(username))) {
      this.showInvalidFormControl(this.ui.$username, i18next.t('login.invalid_username_message'));
      isValid = false;
    } else {
      this.hideInvalidFormControl(this.ui.$username);
    }

    // check password
    if (isValid && !validator.isLength(password, 6)) {
      this.showInvalidFormControl(this.ui.$password, i18next.t('login.invalid_password_message'));
      isValid = false;
    } else {
      this.hideInvalidFormControl(this.ui.$password);
    }

    return isValid;
  },

  enableForm() {
    this.ui.$loginForm.removeClass('disabled');
    this.ui.$login.removeClass('disabled');
    this.ui.$registration.removeClass('disabled');
  },

  disableForm() {
    this.ui.$loginForm.addClass('disabled');
    this.ui.$login.addClass('disabled');
    this.ui.$registration.addClass('disabled');
  },

  onError(errorMessage) {
    this.enableForm();

    if (errorMessage.indexOf('Please try again') >= 0) {
      // _networkError
      NavigationManager.getInstance().showDialogViewByClass(ErrorDialogItemView, {
        title: i18next.t('login.network_error_message'),
        message: errorMessage,
      });
    } else if (errorMessage.indexOf('This account has been suspended') >= 0) {
      // AccountDisabled
      NavigationManager.getInstance().showDialogViewByClass(ErrorDialogItemView, {
        title: i18next.t('login.account_suspended_message'),
        message: errorMessage,
      });
    } else {
      // NotFoundError / BadPasswordError
      this.showInvalidFormControl([this.ui.$username, this.ui.$password], i18next.t('login.invalid_username_or_password_message'));
    }
  },

  /* endregion LOGIN */

  /* region REGISTRATION */

  onShowRegistration() {
    // registration will auto log in on success
    NavigationManager.getInstance().showModalView(new RegistrationItemView());
  },

  /* endregion REGISTRATION */

});

module.exports = LoginMenuItemView;
