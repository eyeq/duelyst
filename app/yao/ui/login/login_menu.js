const Promise = require('bluebird');
const Session = require('app/common/session2');
const Logger = require('app/common/logger');
const EVENTS = require('app/common/event_types');
const CONFIG = require('app/common/config');
const RSX = require('app/data/resources');
const audio_engine = require('app/audio/audio_engine');
const validator = require('validator');
const NavigationManager = require('app/ui/managers/navigation_manager');
const i18next = require('i18next');
const RegistrationItemView = require('../../../ui/views/item/registration');
const ErrorDialogItemView = require('../../../ui/views/item/error_dialog');
const ItemViewYao = require('app/yao/ui/common/item_view_yao');

const LoginMenuItemView = ItemViewYao.extend({

  id: 'app-login',
  template: require('app/yao/ui/login/templates/login_menu.hbs'),

  /* ui selector cache */
  ui: {
    $brandDynamic: '.brand-dynamic',
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
    const brandAnimationDuration = 2.0;

    // slight delay before showing brand to ensure dom is rendered
    this._brandTimeoutId = setTimeout(() => {
      this.showBrand(brandAnimationDuration);
    }, 120.0);

    // slight delay before showing registration block to focus attention on it
    this._registrationTimeoutId = setTimeout(() => {
      this.ui.$registrationBlock.addClass('active');
    }, brandAnimationDuration * 0.5 * 1000.0);

    // show login immediately
    this.ui.$loginForm.addClass('active');

    // login when focused on input and triggering confirm
    this.listenTo(NavigationManager.getInstance(), EVENTS.user_triggered_confirm, function () {
      if (this.ui.$input.is(this.$el.find('input:focus'))) {
        this.onLogin();
      }
    });
  },

  onDestroy() {
    this.unlockTriggeredNavigation();

    if (this._brandTimeoutId != null) {
      clearTimeout(this._brandTimeoutId);
      this._brandTimeoutId = null;
    }
    if (this._registrationTimeoutId != null) {
      clearTimeout(this._registrationTimeoutId);
      this._registrationTimeoutId = null;
    }
  },

  /* endregion EVENTS */

  /* region ANIMATION */

  showBrand(animationDuration) {
    return new Promise((resolve, reject) => {
      // animate brand in
      this.ui.$brandDynamic.addClass('active');
      this.ui.$brandDynamic.find('.draw-line').each(function () {
        const $element = $(this);
        let length = this.getTotalLength() / 5;
        $element.data('length', length);
        $element.css('stroke-dasharray', length);
        $element.css('stroke-dashoffset', length);

        length = $element.data('length');
        $element.css('transition', `stroke-dashoffset ${animationDuration}s ease-in`);
        $element.css('stroke-dashoffset', -length);
      });

      this.ui.$brandDynamic.find('.fill').each(function () {
        const $element = $(this);
        $element.css('transition', `opacity ${animationDuration * 0.5}s ease-out`);
        $element.css('transition-delay', `${animationDuration * 0.5}s`);
        $element.css('opacity', '1');
      });

      this.ui.$brandDynamic.find('.ring-blue').removeClass('active');
      this.ui.$brandDynamic.find('.ring-white').addClass('active');

      this._brandTimeoutId = setTimeout(() => {
        resolve();
      }, animationDuration * 1000.0);
    });
  },

  /* endregion ANIMATION */

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
    if (errorMessage.indexOf('suspended') > 0) {
      NavigationManager.getInstance().showDialogViewByClass(ErrorDialogItemView, { title: i18next.t('login.account_suspended_message'), message: errorMessage });
    } else {
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
