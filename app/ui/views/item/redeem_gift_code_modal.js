'use strict';

const Promise = require('bluebird');
const Analytics = require('app/common/analytics');
const validator = require('validator');
const Template = require('app/ui/templates/item/redeem_gift_code_modal.hbs');
const NavigationManager = require('app/ui/managers/navigation_manager');
const i18next = require('i18next');
const FormPromptModalItemView = require('./util/form_prompt_modal');

const RedeemGiftCodeModalView = FormPromptModalItemView.extend({

  id: 'app-redeem-gift-code',
  template: Template,

  ui: {
    $form: '.prompt-form',
    $submit: '.prompt-submit',
    $submitted: '.prompt-submitted',
    $error: '.prompt-error',
    $errorMessage: '.error-message',
    $success: '.prompt-success',

    $giftCode: '.gift-code',
  },

  _userNavLockId: 'AccountWipeUserNavLockId',

  // #region

  updateValidState: function () {
    var giftCode = this.ui.$giftCode.val();
    var isValid = true;

    // check giftCode
    if (giftCode.length === 0) {
      isValid = false;
    } else {
      if (!validator.isLength(giftCode, 3)) {
        isValid = false;
        this.showInvalidFormControl(this.ui.$giftCode, i18next.t('gift_code_modal.min_char_requirement_error'));
      } else {
        this.hideInvalidFormControl(this.ui.$giftCode);
      }
    }

    return isValid;
  },

  onSubmit: function () {
    FormPromptModalItemView.prototype.onSubmit.apply(this, arguments);

    var giftCode = this.ui.$giftCode.val();

    Promise.resolve($.ajax({
      url: process.env.API_URL + '/api/me/gift_codes',
      type: 'POST',
      data: JSON.stringify({
        gift_code: giftCode,
      }),
      contentType: 'application/json',
      dataType: 'json',
    }))
      .then(this.onSuccess.bind(this))
      .catch(function (response) {
        this.onError(response && response.responseJSON && (response.responseJSON.message || response.responseJSON.error) || i18next.t('gift_code_modal.failed_to_redeem_error'));
      }.bind(this));
  },

  onSuccessComplete: function () {
    FormPromptModalItemView.prototype.onSuccessComplete.apply(this, arguments);
  },

  onErrorComplete: function (errorMessage) {
    FormPromptModalItemView.prototype.onErrorComplete.apply(this, arguments);

    this.showInvalidFormControl(this.ui.$giftCode, errorMessage);
  },

  // #endregion

});

module.exports = RedeemGiftCodeModalView;
