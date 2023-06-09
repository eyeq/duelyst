'use strict';

const Promise = require('bluebird');
const Session = require('app/common/session2');
const Logger = require('app/common/logger');
const EVENTS = require('app/common/event_types');
const CONFIG = require('app/common/config');
const RSX = require('app/data/resources');
const audio_engine = require('app/audio/audio_engine');
const validator = require('validator');
const Animations = require('app/ui/views/animations');
const NavigationManager = require('app/ui/managers/navigation_manager');
const LoginMenuTmpl = require('app/ui/templates/item/login_menu.hbs');
const i18next = require('i18next');
const RegistrationItemView = require('./registration');
const ErrorDialogItemView = require('./error_dialog');
const MyItemView = require('./util/my_item_view');

const LoginMenuItemView = MyItemView.extend({

  template: LoginMenuTmpl,

  id: 'app-login',
  className: 'login-menu',

  ui: {
    $brandDynamic: '.brand-dynamic',
    $input: 'input',
    $login: '.login',
    $loginForm: '.login-form',
    $registrationBlock: '.registration-block',
    $registration: '.registration',
    $forgotPassword: '.forgot-password',
    $username: '.login-username',
    $password: '.login-password',
  },

  events: {
    'click .login': 'onLoginClick',
    'click .registration': 'onShowRegistration',
  },

  // #region Property

  animateIn: Animations.fadeIn,
  animateOut: Animations.fadeOut,

  _userNavLockId: 'LoginUserNavLockId',

  // #endregion

  // #region Backbone

  initialize: function () {
  },

  onRender: function () {
    MyItemView.prototype.onRender.apply(this, arguments);

    this.enableForm();
  },

  onShow: function () {
    const brandAnimationDuration = 2.0;

    // slight delay before showing brand to ensure dom is rendered
    this._brandTimeoutId = setTimeout(function () {
      this.showBrand(brandAnimationDuration);
    }.bind(this), 120.0);

    // slight delay before showing registration block to focus attention on it
    this._registrationTimeoutId = setTimeout(function () {
      this.ui.$registrationBlock.addClass('active');
    }.bind(this), brandAnimationDuration * 0.5 * 1000.0);

    // show login immediately
    this.ui.$loginForm.addClass('active');

    // login when focused on input and triggering confirm
    this.listenTo(NavigationManager.getInstance(), EVENTS.user_triggered_confirm, function () {
      if (this.ui.$input.is(this.$el.find('input:focus'))) {
        this.onLoginClick();
      }
    });
  },

  onDestroy: function () {
    // unlock user triggered navigation
    NavigationManager.getInstance().requestUserTriggeredNavigationUnlocked(this._userNavLockId);

    if (this._brandTimeoutId != null) {
      clearTimeout(this._brandTimeoutId);
      this._brandTimeoutId = null;
    }
    if (this._registrationTimeoutId != null) {
      clearTimeout(this._registrationTimeoutId);
      this._registrationTimeoutId = null;
    }
  },

  // #endregion

  // #region Event

  onLoginClick: function () {
    const isValid = this.updateValidState();
    if (isValid) {
      audio_engine.current().play_effect_for_interaction(RSX.sfx_ui_confirm.audio, CONFIG.CONFIRM_SFX_PRIORITY);

      this.disableForm();
      this.onLogin(this.ui.$username.val(), this.ui.$password.val());
    } else {
      audio_engine.current().play_effect_for_interaction(RSX.sfx_ui_error.audio, CONFIG.ERROR_SFX_PRIORITY);
    }
  },

  onShowRegistration: function () {
    // registration will auto log in on success
    NavigationManager.getInstance().showModalView(new RegistrationItemView());
  },

  // #region

  showBrand: function (animationDuration) {
    return new Promise(function (resolve, reject) {
      // animate brand in
      this.ui.$brandDynamic.addClass('active');
      this.ui.$brandDynamic.find('.draw-line').each(function () {
        const $element = $(this);
        let length = this.getTotalLength() / 5;
        $element.data('length', length);
        $element.css('stroke-dasharray', length);
        $element.css('stroke-dashoffset', length);

        length = $element.data('length');
        $element.css('transition', 'stroke-dashoffset ' + animationDuration + 's ease-in');
        $element.css('stroke-dashoffset', -length);
      });

      this.ui.$brandDynamic.find('.fill').each(function () {
        const $element = $(this);
        $element.css('transition', 'opacity ' + animationDuration * 0.5 + 's ease-out');
        $element.css('transition-delay', animationDuration * 0.5 + 's');
        $element.css('opacity', '1');
      });

      this.ui.$brandDynamic.find('.ring-blue').removeClass('active');
      this.ui.$brandDynamic.find('.ring-white').addClass('active');

      this._brandTimeoutId = setTimeout(function () {
        resolve();
      }.bind(this), animationDuration * 1000.0);
    }.bind(this));
  },

  onLogin: function (username, password) {
    // lockdown user triggered navigation while we login
    NavigationManager.getInstance().requestUserTriggeredNavigationLocked(this._userNavLockId);
    Session.login(username, password)
      .bind(this)
      .catch(function (e) {
        // onError expects a string not an actual error
        this.onError(e.codeMessage || e.innerMessage || e.message);
      })
      .finally(function () {
        // unlock user triggered navigation
        NavigationManager.getInstance().requestUserTriggeredNavigationUnlocked(this._userNavLockId);
      });
  },

  updateValidState: function () {
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

  enableForm: function () {
    this.ui.$loginForm.removeClass('disabled');
    this.ui.$login.removeClass('disabled');
    this.ui.$registration.removeClass('disabled');
    this.ui.$forgotPassword.removeClass('disabled');
  },

  disableForm: function () {
    this.ui.$loginForm.addClass('disabled');
    this.ui.$login.addClass('disabled');
    this.ui.$registration.addClass('disabled');
    this.ui.$forgotPassword.addClass('disabled');
  },

  onError: function (errorMessage) {
    this.enableForm();

    if (errorMessage === 'Please try again') {
      NavigationManager.getInstance().showDialogViewByClass(ErrorDialogItemView, { title: i18next.t('login.network_error'), message: errorMessage });
    } else if (errorMessage.indexOf('suspended') > 0) {
      NavigationManager.getInstance().showDialogViewByClass(ErrorDialogItemView, { title: i18next.t('login.account_suspended_message'), message: errorMessage });
    } else {
      this.showInvalidFormControl([this.ui.$username, this.ui.$password], i18next.t('login.invalid_username_or_password_message'));
    }
  },

  // #endregion
});

module.exports = LoginMenuItemView;
