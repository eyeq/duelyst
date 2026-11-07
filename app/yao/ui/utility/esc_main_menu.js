const CONFIG = require('app/common/config');
const Session = require('app/common/session2');
const RSX = require('app/data/resources');
const audio_engine = require('app/audio/audio_engine');
const NavigationManager = require('app/ui/managers/navigation_manager');
const ProfileManager = require('app/ui/managers/profile_manager');
const i18next = require('i18next');
const CompositeViewYao = require('app/yao/ui/common/composite_view_yao');

const EscMainMenuItemView = CompositeViewYao.extend({

  id: 'app-esc-main-menu',
  className: 'modal duelyst-modal',
  template: require('app/yao/ui/utility/templates/esc_main_menu.hbs'),

  ui: {
    $desktopQuit: '.desktop-quit',
    $logout: '.logout',
  },

  events: {
    'click .settings': 'toggleSettingsMenu',

    'click .desktop-quit': 'onDesktopQuitClicked',
    'click .logout': 'onLogoutClicked',
  },

  onRender() {
    CompositeViewYao.prototype.onRender.apply(this, arguments);

    if (!window.isDesktop) {
      this.ui.$desktopQuit.remove();
    }
    if (!ProfileManager.getInstance().get('id')) {
      this.ui.$logout.addClass('disabled');
    }
  },

  onShow() {
    CompositeViewYao.prototype.onShow.apply(this, arguments);

    audio_engine.current().play_effect_for_interaction(RSX.sfx_ui_tab_in.audio, CONFIG.SHOW_SFX_PRIORITY);
  },

  onLogoutClicked() {
    if (ProfileManager.getInstance().get('id')) {
      NavigationManager.getInstance().showDialogForConfirmation(i18next.t('settings.confirm_logout_message'), '', i18next.t('common.logout_button_label'))
        .then(() => {
          Session.logout();
        }).catch(() => { });
    }
  },

  onDesktopQuitClicked() {
    if (window.isDesktop) {
      NavigationManager.getInstance().showDialogForConfirmation(i18next.t('settings.confirm_quit_message'), '', i18next.t('common.quit_button_label'))
        .then(() => {
          window.quitDesktop();
        }).catch(() => { });
    }
  },

});

module.exports = EscMainMenuItemView;
