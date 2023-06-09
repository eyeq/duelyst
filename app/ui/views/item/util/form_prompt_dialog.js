'use strict';

const EVENTS = require('app/common/event_types');
const NavigationManager = require('app/ui/managers/navigation_manager');
const FormPromptModalItemView = require('./form_prompt_modal');

/**
 * Dialog version of form prompt modal. Do not use this class directly.
 */
const FormPromptDialogItemView = FormPromptModalItemView.extend({

  // #region Backbone

  onShow: function () {
    this.updateValidState();

    // listen to user attempted actions
    this.listenTo(NavigationManager.getInstance(), EVENTS.user_attempt_cancel, this.onCancel);
    this.listenTo(NavigationManager.getInstance(), EVENTS.user_attempt_confirm, this.onClickSubmit);

    this.$el.find('input').first().focus();
  },

  // #endregion

  // #region

  onCancel: function () {
    NavigationManager.getInstance().destroyDialogView();
  },

  onSubmit: function () {
    FormPromptModalItemView.prototype.onSubmit.apply(this, arguments);

    this.$el.find('.btn-user-cancel').hide();
  },

  onSuccessComplete: function () {
    FormPromptModalItemView.prototype.onSuccessComplete.apply(this, arguments);

    NavigationManager.getInstance().destroyDialogView();
  },

  onErrorComplete: function () {
    FormPromptModalItemView.prototype.onErrorComplete.apply(this, arguments);

    this.$el.find('.btn-user-cancel').show();
  },

  // #endregion
});

// Expose the class either via CommonJS or the global object
module.exports = FormPromptDialogItemView;
