const CONFIG = require('app/common/config');
const Session = require('app/common/session2');
const SDK = require('app/sdk');
const RSX = require('app/data/resources');
const audio_engine = require('app/audio/audio_engine');
const NavigationManager = require('app/ui/managers/navigation_manager');
const UtilityMenuItemView = require('app/ui/views/item/utility_menu');
const ConfirmDialogItemView = require('app/ui/views/item/confirm_dialog');

const EscMainMenuItemView = UtilityMenuItemView.extend({

  id: 'app-esc-main-menu',
  className: 'modal duelyst-modal',
  template: require('app/yao/ui/utility/templates/esc_main_menu.hbs'),

  onRender() {
    UtilityMenuItemView.prototype.onRender.apply(this, arguments);

    if (window.isDesktop) {
      this.$el.find('.desktop-quit').on('click', this.onDesktopQuitClicked.bind(this));
    } else {
      this.$el.find('.desktop-quit').remove();
    }
  },

  onShow() {
    UtilityMenuItemView.prototype.onShow.apply(this, arguments);

    // show ZENDSEK widget
    window.zE && window.zE.show && window.zE.show();

    audio_engine.current().play_effect_for_interaction(RSX.sfx_ui_tab_in.audio, CONFIG.SHOW_SFX_PRIORITY);
  },

  onDestroy() {
    // hide ZENDSEK widget
    window.zE && window.zE.hide && window.zE.hide();
  },

  animateReveal() {
    // don't animate reveal esc menu
  },

  onLoggedInRender() {
    UtilityMenuItemView.prototype.onLoggedInRender.apply(this, arguments);
    this.$el.find('.logout').on('click', this.onLogoutClicked.bind(this));
  },

  onLoggedOutRender() {
    UtilityMenuItemView.prototype.onLoggedOutRender.apply(this, arguments);
    this.$el.find('.logout').addClass('disabled');
  },

  onLogoutClicked() {
    const confirmDialogItemView = new ConfirmDialogItemView({ title: 'Are you sure you want to logout?' });
    this.listenToOnce(confirmDialogItemView, 'confirm', () => {
      Session.logout();
    });
    this.listenToOnce(confirmDialogItemView, 'cancel', () => {
      this.stopListening(confirmDialogItemView);
    });
    NavigationManager.getInstance().showDialogView(confirmDialogItemView);
  },

  onDesktopQuitClicked() {
    if (window.isDesktop) {
      const confirmDialogItemView = new ConfirmDialogItemView({ title: 'Are you sure you want to quit?' });
      this.listenToOnce(confirmDialogItemView, 'confirm', () => {
        window.quitDesktop();
      });
      this.listenToOnce(confirmDialogItemView, 'cancel', () => {
        this.stopListening(confirmDialogItemView);
      });
      NavigationManager.getInstance().showDialogView(confirmDialogItemView);
    }
  },

});

// Expose the class either via CommonJS or the global object
module.exports = EscMainMenuItemView;
