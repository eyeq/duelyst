const Promise = require('bluebird');
const CONFIG = require('app/common/config');
const RSX = require('app/data/resources');
const audio_engine = require('app/audio/audio_engine');
const Animations = require('app/ui/views/animations');
const EVENTS = require('app/common/event_types');
const NavigationManager = require('app/ui/managers/navigation_manager');
const ItemViewYao = require('app/yao/ui/common/item_view_yao');

const ModalDialogViewYao = ItemViewYao.extend({

  className: 'modal prompt-modal',

  ui: {
    $form: '.prompt-form',
    $submitted: '.prompt-submitted',
    $success: '.prompt-success',
    $error: '.prompt-error',
    $errorMessage: '.error-message',
  },

  events: {
    'click .prompt-submit': 'onSubmit',
    'click .prompt-cancel': 'onCancel',
    'click .prompt-error-back': 'onErrorBack',
  },

  animateIn: Animations.fadeIn,
  animateOut: Animations.fadeOut,

  _transparent: false,

  onBeforeRender() {
    ItemViewYao.prototype.onBeforeRender.apply(this, arguments);
  },

  onRender() {
    ItemViewYao.prototype.onRender.apply(this, arguments);

    this.enableForm(this.ui.$form);
  },

  onShow() {
    if (this._transparent) {
      this.listenTo(NavigationManager.getInstance(), EVENTS.user_attempt_cancel, this.onCancel);
      this.listenTo(NavigationManager.getInstance(), EVENTS.user_attempt_confirm, this.onSubmit);
    } else {
      this.listenTo(NavigationManager.getInstance(), EVENTS.user_triggered_confirm, this.onSubmit);
    }

    this.$el.find('input').first().focus();
  },

  onDestroy() {
    ItemViewYao.prototype.onDestroy.apply(this, arguments);
  },

  onSubmit() {
    const isValid = this.updateValidState();
    if (isValid) {
      this.enableForm(this.ui.$submitted);

      audio_engine.current().play_effect_for_interaction(RSX.sfx_ui_confirm.audio, CONFIG.CONFIRM_SFX_PRIORITY);
      this.submit();
    } else {
      audio_engine.current().play_effect_for_interaction(RSX.sfx_ui_error.audio, CONFIG.ERROR_SFX_PRIORITY);
    }
  },

  onCancel() {
    audio_engine.current().play_effect_for_interaction(RSX.sfx_ui_cancel.audio, CONFIG.CANCEL_SFX_PRIORITY);
    this.destroyView();
  },

  onSuccess(res) {
    const args = arguments;

    this.enableForm(this.ui.$success);
    this.onSuccessComplete.apply(this, args);

    this.trigger('success');
  },

  onError(errorMessage) {
    this.enableForm(this.ui.$error);
    this.ui.$errorMessage.text(errorMessage);

    this.trigger('error', errorMessage);
  },

  onErrorBack() {
    this.enableForm(this.ui.$form);
    this.onErrorComplete();
  },

  enableForm($elem) {
    this.ui.$form.removeClass('active');
    this.ui.$submitted.removeClass('active');
    this.ui.$success.removeClass('active');
    this.ui.$error.removeClass('active');

    $elem.addClass('active');
  },

  destroyView() {
    if (this._transparent) {
      NavigationManager.getInstance().destroyDialogView();
    } else {
      NavigationManager.getInstance().destroyModalView();
    }
  },

  // abstract
  updateValidState() { return this.ui.$form.hasClass('active'); },

  // abstract
  submit() {
    this.lockTriggeredNavigation();
    // call this.onSuccess(); or this.onError(errorMessage);
  },

  // abstract
  onSuccessComplete(res) {
    this.unlockTriggeredNavigation();
    this.destroyView();
  },

  // abstract
  onErrorComplete() {
    this.unlockTriggeredNavigation();
  },

  showModalView() {
    this._transparent = false;
    NavigationManager.getInstance().showModalView(this);
  },

  showDialogView() {
    this._transparent = true;
    NavigationManager.getInstance().showDialogView(this);
  },
});

module.exports = ModalDialogViewYao;
