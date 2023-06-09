'use strict';

const _ = require('underscore');
const Promise = require('bluebird');
const CONFIG = require('app/common/config');
const RSX = require('app/data/resources');
const audio_engine = require('app/audio/audio_engine');
const Animations = require('app/ui/views/animations');
const EVENTS = require('app/common/event_types');
const NavigationManager = require('app/ui/managers/navigation_manager');
const openUrl = require('app/common/openUrl');

/**
 * Abstract form prompt modal. Do not use this class directly.
 */
const FormPromptModalItemView = Backbone.Marionette.ItemView.extend({

  className: 'modal prompt-modal',

  /* ui selector cache */
  ui: {
    $form: '.prompt-form',
    $submit: '.prompt-submit',
    $submitted: '.prompt-submitted',
    $error: '.prompt-error',
    $errorMessage: '.error-message',
    $success: '.prompt-success',
  },

  events: {
    'click .prompt-submit': 'onClickSubmit',
    'click .prompt-cancel': 'onClickCancel',
    'input .form-control': 'onFormControlChangeContent',
    'blur .form-control': 'onFormControlBlur',
  },

  // #region Property

  animateIn: Animations.fadeIn,
  animateOut: Animations.fadeOut,

  // whether form is in process of submitting
  submitting: false,

  // duration in seconds to wait after a user finishes typing to update the valid state
  updateValidStateDelay: 0.5,
  updateValidStateDebounced: null,

  // duration in seconds to show status messages
  successMessageDuration: 3.0,
  errorMessageDuration: 3.0,
  errorMessageDurationLong: 10.0,

  _userNavLockId: 'FormPromptModalUserNavLockId',

  // #endregion

  // #region Backbone

  initialize: function () {
    this.updateValidStateDebounced = _.debounce(this.updateValidState.bind(this), this.updateValidStateDelay * 1000.0);
  },

  onBeforeRender: function () {
    this.$el.find('[data-toggle=\'tooltip\']').tooltip('destroy');
  },

  onRender: function () {
    this.$el.find('[data-toggle=\'tooltip\']').tooltip();
    this.ui.$form.addClass('active');
    this.updateValidState();

    // auto wire target blank links to open in a new window
    $('a', this.$el).each(function (i) {
      if ($(this).attr('target') == '_blank') {
        $(this).on('click', function (e) {
          openUrl($(e.currentTarget).attr('href'));
          e.stopPropagation();
          e.preventDefault();
        });
      }
    });
  },

  onShow: function () {
    this.listenTo(NavigationManager.getInstance(), EVENTS.user_triggered_confirm, this.onClickSubmit);
    this.updateValidState();
  },

  onDestroy: function () {
    // unlock user triggered navigation
    NavigationManager.getInstance().requestUserTriggeredNavigationUnlocked(this._userNavLockId);

    if (this._successTimeoutId != null) {
      clearTimeout(this._successTimeoutId);
      this._successTimeoutId = null;
    }
    if (this._errorTimeoutId != null) {
      clearTimeout(this._errorTimeoutId);
      this._errorTimeoutId = null;
    }
  },

  // #endregion

  // #region Event

  onFormControlChangeContent: function () {
    this.updateValidStateDebounced();
  },

  onFormControlBlur: function () {
    this.updateValidState();
  },

  onClickSubmit: function () {
    if (this.submitting) {
      audio_engine.current().play_effect_for_interaction(RSX.sfx_ui_error.audio, CONFIG.ERROR_SFX_PRIORITY);
      return;
    }

    const isValid = this.updateValidState();
    if (!isValid) {
      audio_engine.current().play_effect_for_interaction(RSX.sfx_ui_error.audio, CONFIG.ERROR_SFX_PRIORITY);
      return;
    }

    this.submitting = true;
    audio_engine.current().play_effect_for_interaction(RSX.sfx_ui_confirm.audio, CONFIG.CONFIRM_SFX_PRIORITY);

    // show activity
    this.ui.$form.removeClass('active');
    this.ui.$submitted.addClass('active');

    this.onSubmit();
  },

  onClickCancel: function () {
    if (this.submitting) {
      return;
    }

    audio_engine.current().play_effect_for_interaction(RSX.sfx_ui_cancel.audio, CONFIG.CANCEL_SFX_PRIORITY);
    this.onCancel();
  },

  // #endregion

  // #region

  /**
   * Method called automatically on successful submission.
   */
  onSuccess: function () {
    // we don't know what will be passed to the success method, so we'll pass everything along
    const successArgs = arguments;

    // show success
    this.ui.$submitted.removeClass('active');
    this.ui.$success.addClass('active');

    this._successTimeoutId = setTimeout(function () {
      this.onSuccessComplete.apply(this, successArgs);
    }.bind(this), this.successMessageDuration * 1000.0);
  },

  /**
   * Method called automatically on success completion.
   */
  onSuccessComplete: function () {
    // unlock user triggered navigation
    NavigationManager.getInstance().requestUserTriggeredNavigationUnlocked(this._userNavLockId);

    // trigger success to notify that we've finished
    this.trigger('success');
  },

  /**
   * Method called automatically on failed submission.
   */
  onError: function (errorMessage) {
    // we don't know what will be passed to the error method, so we'll pass everything along
    const errorArgs = arguments;

    // show error
    this.ui.$submitted.removeClass('active');
    this.ui.$error.addClass('active');
    this.ui.$errorMessage.text(errorMessage);

    let errorDuration = this.errorMessageDuration;
    if (errorMessage.length > 30) {
      errorDuration = this.errorMessageDurationLong;
    }

    this._errorTimeoutId = setTimeout(function () {
      this.onErrorComplete.apply(this, errorArgs);
    }.bind(this), errorDuration * 1000.0);
  },

  /**
   * Method called automatically on failure completion.
   */
  onErrorComplete: function (errorMessage) {
    // unlock user triggered navigation
    NavigationManager.getInstance().requestUserTriggeredNavigationUnlocked(this._userNavLockId);

    // no longer submitting
    this.submitting = false;

    // show form again
    this.ui.$error.removeClass('active');
    this.ui.$form.addClass('active');

    // trigger error to notify of issue
    this.trigger('error', errorMessage);
  },

  showInvalidFormControl: function ($formControl, helpMessage) {
    $formControl.closest('.form-group').addClass('has-error');
    $formControl.off('input');
    $formControl.one('input', function () { this.hideInvalidFormControl($formControl); }.bind(this));

    const tooltipData = $formControl.data('bs.tooltip');
    if (tooltipData == null || tooltipData.options.title !== helpMessage) {
      $formControl.tooltip('destroy').tooltip({ title: helpMessage || 'Invalid input', placement: 'right', trigger: 'manual' }).tooltip('show');
    }
  },

  hideInvalidFormControl: function ($formControl) {
    $formControl.closest('.form-group').removeClass('has-error');
    $formControl.off('input');
    $formControl.tooltip('destroy');
  },

  updateValidState: function () {
    return true;
  },

  onSubmit: function () {
    NavigationManager.getInstance().requestUserTriggeredNavigationLocked(this._userNavLockId);
  },

  onCancel: function () {
    NavigationManager.getInstance().destroyModalView();
  },

  // #endregion
});

// Expose the class either via CommonJS or the global object
module.exports = FormPromptModalItemView;
