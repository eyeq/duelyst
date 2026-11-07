const CONFIG = require('app/common/config');
const EventBus = require('app/common/eventbus');
const EVENTS = require('app/common/event_types');
const Session = require('app/common/session2');
const generatePushID = require('app/common/generate_push_id');
const Scene = require('app/view/Scene');
const Logger = require('app/common/logger');
const Storage = require('app/common/storage');
const UtilsJavascript = require('app/common/utils/utils_javascript');
const RSX = require('app/data/resources');
const audio_engine = require('app/audio/audio_engine');
const Animations = require('app/ui/views/animations');
const NavigationManager = require('app/ui/managers/navigation_manager');
const ProfileManager = require('app/ui/managers/profile_manager');
const ChangePasswordItemView = require('app/yao/ui/profile/change_password');
const ChangeUsernameItemView = require('app/yao/ui/profile/change_username');
const i18next = require('i18next');

const SettingsMenuView = Backbone.Marionette.ItemView.extend({

  id: 'settings-menu',
  className: 'modal duelyst-modal',
  template: require('app/yao/ui/utility/templates/settings_menu.hbs'),

  /* ui selector cache */
  ui: {
    $versionTag: '#version-tag',

    $language: '#language',
    $resolution: '#resolution',
    $checkboxFullscreen: '#checkbox-fullscreen-enabled',

    $checkboxHiDPIEnabled: '#checkbox-hi-dpi-enabled',
    $buttonLightingQualityLow: '#lighting-quality-low',
    $buttonLightingQualityMedium: '#lighting-quality-medium',
    $buttonLightingQualityHigh: '#lighting-quality-high',
    $buttonShadowQualityLow: '#shadow-quality-low',
    $buttonShadowQualityMedium: '#shadow-quality-medium',
    $buttonShadowQualityHigh: '#shadow-quality-high',
    $buttonBoardQualityLow: '#board-quality-low',
    $buttonBoardQualityHigh: '#board-quality-high',
    $bloom: '#bloom',
    $checkboxRazerChromaEnabled: '#checkbox-razer-chroma-enabled',

    $checkboxAlwaysShowStats: '#checkbox-always-show-stats',
    $checkboxShowInGameTips: '#checkbox-show-in-game-tips',
    $checkboxShowBattleLog: '#checkbox-show-battlelog',
    $checkboxPlayerDetails: '#checkbox-player-details',
    $checkboxStickyTargeting: '#checkbox-sticky-targeting',

    $masterVolume: '#master-volume',
    $musicVolume: '#music-volume',
    $voiceVolume: '#voice-volume',
    $effectsVolume: '#effects-volume',

    $checkboxDoNotDisturb: '#checkbox-do-not-disturb',
    $checkboxBlockSpectators: '#checkbox-block-spectators',
  },

  /* Ui events hash */
  events: {
    'click button.logout': 'onLogoutClicked',
    'click button.desktop-quit': 'onDesktopQuitClicked',

    'change #language': 'changeLanguage',
    'change #resolution': 'changeResolution',
    'change #checkbox-fullscreen-enabled': 'changeFullscreen',

    'change #checkbox-hi-dpi-enabled': 'changeHiDPIEnabled',
    'click #lighting-quality-low': 'changeLightingQualityLow',
    'click #lighting-quality-medium': 'changeLightingQualityMedium',
    'click #lighting-quality-high': 'changeLightingQualityHigh',
    'click #shadow-quality-low': 'changeShadowQualityLow',
    'click #shadow-quality-medium': 'changeShadowQualityMedium',
    'click #shadow-quality-high': 'changeShadowQualityHigh',
    'click #board-quality-low': 'changeBoardQualityLow',
    'click #board-quality-high': 'changeBoardQualityHigh',
    'change #bloom': 'changeBloom',
    'change #checkbox-razer-chroma-enabled': 'changeRazerChromaEnabled',

    'change #checkbox-always-show-stats': 'changeAlwaysShowStats',
    'change #checkbox-show-in-game-tips': 'changeShowInGameTips',
    'change #checkbox-show-battlelog': 'changeShowBattleLog',
    'change #checkbox-player-details': 'changeShowPlayerDetails',
    'change #checkbox-sticky-targeting': 'changeStickyTargeting',

    'change #master-volume': 'changeMasterVolume',
    'change #music-volume': 'changeMusicVolume',
    'change #voice-volume': 'changeVoiceVolume',
    'change #effects-volume': 'changeEffectsVolume',

    'change #checkbox-do-not-disturb': 'changeDoNotDisturb',
    'change #checkbox-block-spectators': 'changeBlockSpectators',

    'click .change-username': 'onChangeUsernameClicked',
    'click .change-password': 'onChangePasswordClicked',
  },

  templateHelpers: {
    resolutionsThatFit() {
      return this._resolutionsThatFit;
    },
    resolutionsThatDontFit() {
      return this._resolutionsThatDontFit;
    },
  },

  animateIn: Animations.fadeIn,
  animateOut: Animations.fadeOut,

  _requestId: null,
  _resolutionsThatFit: null,
  _resolutionsThatDontFit: null,

  initialize() {
    // generate unique id for requests
    this._requestId = generatePushID();
    this._resolutionsThatFit = [];
    this._resolutionsThatDontFit = [];

    // check whether changing viewport settings will do anything
    // generate global scale for resolution auto setting
    const $html = $('html');
    const screenWidth = $html.width();
    const screenHeight = $html.height();

    // check all resolutions and sort by whether they fit into user's current screen size
    const resolutions = UtilsJavascript.deepCopy(CONFIG.RESOLUTIONS);
    for (let i = 0, il = resolutions.length; i < il; i++) {
      const resolutionData = resolutions[i];
      if (resolutionData.value === CONFIG.RESOLUTION_AUTO || resolutionData.value === CONFIG.RESOLUTION_PIXEL_PERFECT) {
        this._resolutionsThatFit.push(resolutionData);
      } else {
        const resolution = $.trim(resolutionData.description);
        const resWidth = parseInt(resolution.replace(/x[\s\t]*?\d+/, ''), 10);
        const resHeight = parseInt(resolution.replace(/\d+[\s\t]*?x/, ''), 10);
        if (resWidth > screenWidth || resHeight > screenHeight) {
          this._resolutionsThatDontFit.push(resolutionData);
        } else {
          this._resolutionsThatFit.push(resolutionData);
        }
      }
    }
  },

  onBeforeRender() {
    this.$el.find('[data-toggle=\'tooltip\']').tooltip('destroy');
  },

  onRender() {
    this.ui.$bloom.attr('min', CONFIG.BLOOM_MIN);
    this.ui.$bloom.attr('max', CONFIG.BLOOM_MAX);
    this.ui.$bloom.attr('step', 0.05);

    const currentLanguageKey = Storage.get('preferredLanguageKey') || 'en';
    this.ui.$language.val(currentLanguageKey);
    this.ui.$resolution.val(parseFloat(CONFIG.resolution));
    this.ui.$checkboxFullscreen.prop('checked', Storage.get('fullscreen', true));

    this.ui.$checkboxHiDPIEnabled.prop('checked', CONFIG.hiDPIEnabled);

    if (this.model) {
      this._updateLightingQualityUI();
      this._updateShadowQualityUI();
      this._updateBoardQualityUI();
      this.ui.$bloom.val(parseFloat(this.model.get('bloom')));
      this.ui.$checkboxRazerChromaEnabled.prop('checked', this.model.get('razerChromaEnabled'));

      this.ui.$checkboxAlwaysShowStats.prop('checked', this.model.get('alwaysShowStats'));
      this.ui.$checkboxShowInGameTips.prop('checked', this.model.get('showInGameTips'));
      this.ui.$checkboxShowBattleLog.prop('checked', this.model.get('showBattleLog'));
      this.ui.$checkboxPlayerDetails.prop('checked', this.model.get('showPlayerDetails'));
      this.ui.$checkboxStickyTargeting.prop('checked', this.model.get('stickyTargeting'));

      this.ui.$masterVolume.val(parseFloat(this.model.get('masterVolume')));
      this.ui.$musicVolume.val(parseFloat(this.model.get('musicVolume')));
      this.ui.$voiceVolume.val(parseFloat(this.model.get('voiceVolume')));
      this.ui.$effectsVolume.val(parseFloat(this.model.get('effectsVolume')));

      this.ui.$checkboxDoNotDisturb.prop('checked', this.model.get('doNotDisturb'));
      this.ui.$checkboxBlockSpectators.prop('checked', this.model.get('blockSpectators'));
    } else {
      this.$el.find('.settings-category.visual-panel').remove();
      this.$el.find('.settings-category.audio-panel').remove();
      this.$el.find('.settings-category.game-panel').remove();
      this.$el.find('.settings-category.account-panel').remove();
      this.$el.find('.logout').remove();
    }

    if (!window.isDesktop) {
      this.$el.find('.desktop-quit').remove();
      this.$el.find('.desktop-only').remove();
    }

    this.ui.$versionTag.text(`v${process.env.VERSION}`);

    this.$el.find('[data-toggle=\'tooltip\']').tooltip();
  },

  onShow() {
    // listen to global events
    this.listenTo(EventBus.getInstance(), EVENTS.resize, this.onResize);

    // listen to model events
    if (this.model) {
      this.listenTo(this.model, 'change:lightingQuality', this._updateLightingQualityUI.bind(this));
      this.listenTo(this.model, 'change:shadowQuality', this._updateShadowQualityUI.bind(this));
      this.listenTo(this.model, 'change:boardQuality', this._updateBoardQualityUI.bind(this));
    }

    // change gradient color mapping
    Scene.getInstance().getFX().showGradientColorMap(this._requestId, CONFIG.ANIMATE_FAST_DURATION, {
      r: 194, g: 203, b: 220, a: 255,
    }, {
      r: 36, g: 51, b: 65, a: 255,
    });

    audio_engine.current().play_effect_for_interaction(RSX.sfx_ui_tab_in.audio, CONFIG.SHOW_SFX_PRIORITY);
  },

  onPrepareForDestroy() {
    // reset gradient color mapping
    Scene.getInstance().getFX().clearGradientColorMap(this._requestId, CONFIG.ANIMATE_MEDIUM_DURATION);
  },

  onResize() {
    this.ui.$resolution.val(parseFloat(CONFIG.resolution));
    this.ui.$checkboxHiDPIEnabled.prop('checked', CONFIG.hiDPIEnabled);
  },

  /* event handlers */

  onChangeUsernameClicked() {
    new ChangeUsernameItemView({ model: ProfileManager.getInstance().profile }).showDialogView();
  },

  onChangePasswordClicked() {
    new ChangePasswordItemView().showDialogView();
  },

  onLogoutClicked() {
    NavigationManager.getInstance().showDialogForConfirmation(i18next.t('utility.confirm_logout_message'), '', i18next.t('common.logout_button_label'))
      .then(() => {
        Session.logout();
      });
  },

  onDesktopQuitClicked() {
    if (window.isDesktop) {
      NavigationManager.getInstance().showDialogForConfirmation(i18next.t('utility.confirm_quit_message'), '', i18next.t('common.quit_button_label'))
        .then(() => {
          window.quitDesktop();
        });
    }
  },

  changeResolution() {
    const res = parseInt(this.ui.$resolution.val(), 10);
    if (CONFIG.resolution !== res) {
      CONFIG.resolution = res;
      Storage.set('resolution', res);
      EventBus.getInstance().trigger(EVENTS.request_resize);
    }
  },

  changeFullscreen() {
    const enabled = this.ui.$checkboxFullscreen.prop('checked');
    const current = Storage.get('fullscreen', true);
    if (current !== enabled) {
      Storage.set('fullscreen', enabled);
      if (enabled) {
        window.ipcRenderer.send('setFullScreen');
      } else {
        window.ipcRenderer.send('exitFullScreen');
      }
      EventBus.getInstance().trigger(EVENTS.request_resize);
    }
  },

  changeLanguage() {
    const languageKey = this.ui.$language.val();
    const currentLanguageKey = Storage.get('preferredLanguageKey') || 'en';
    if (currentLanguageKey !== languageKey) {
      Storage.set('preferredLanguageKey', languageKey);
      EventBus.getInstance().trigger(EVENTS.request_reload, { id: 'language_changed', message: 'Language Changed.  Please restart.' });
    }
  },

  changeHiDPIEnabled() {
    const enabled = this.ui.$checkboxHiDPIEnabled.prop('checked');
    if (CONFIG.hiDPIEnabled !== enabled) {
      CONFIG.hiDPIEnabled = enabled;
      Storage.set('hiDPIEnabled', enabled);
      EventBus.getInstance().trigger(EVENTS.request_resize);
    }
  },

  changeLightingQualityLow() {
    this.model.set('lightingQuality', CONFIG.LIGHTING_QUALITY_LOW);
  },

  changeLightingQualityMedium() {
    this.model.set('lightingQuality', CONFIG.LIGHTING_QUALITY_MEDIUM);
  },

  changeLightingQualityHigh() {
    this.model.set('lightingQuality', CONFIG.LIGHTING_QUALITY_HIGH);
  },

  changeShadowQualityLow() {
    this.model.set('shadowQuality', CONFIG.SHADOW_QUALITY_LOW);
  },

  changeShadowQualityMedium() {
    this.model.set('shadowQuality', CONFIG.SHADOW_QUALITY_MEDIUM);
  },

  changeShadowQualityHigh() {
    this.model.set('shadowQuality', CONFIG.SHADOW_QUALITY_HIGH);
  },

  changeBoardQualityLow() {
    this.model.set('boardQuality', CONFIG.SHADOW_QUALITY_LOW);
  },

  changeBoardQualityHigh() {
    this.model.set('boardQuality', CONFIG.SHADOW_QUALITY_HIGH);
  },

  changeBloom() {
    this.model.set('bloom', this.ui.$bloom.val());
  },

  changeDoNotDisturb() {
    this.model.set('doNotDisturb', this.ui.$checkboxDoNotDisturb.prop('checked'));
  },

  changeBlockSpectators() {
    this.model.set('blockSpectators', this.ui.$checkboxBlockSpectators.prop('checked'));
  },

  changeAlwaysShowStats() {
    this.model.set('alwaysShowStats', this.ui.$checkboxAlwaysShowStats.prop('checked'));
  },

  changeShowBattleLog() {
    this.model.set('showBattleLog', this.ui.$checkboxShowBattleLog.prop('checked'));
  },

  changeShowPlayerDetails() {
    this.model.set('showPlayerDetails', this.ui.$checkboxPlayerDetails.prop('checked'));
  },

  changeStickyTargeting() {
    this.model.set('stickyTargeting', this.ui.$checkboxStickyTargeting.prop('checked'));
  },

  changeRazerChromaEnabled() {
    this.model.set('razerChromaEnabled', this.ui.$checkboxRazerChromaEnabled.prop('checked'));
  },

  changeShowInGameTips() {
    this.model.set('showInGameTips', this.ui.$checkboxShowInGameTips.prop('checked'));
  },

  changeMasterVolume() {
    this.model.set('masterVolume', this.ui.$masterVolume.val());
  },

  changeMusicVolume() {
    this.model.set('musicVolume', this.ui.$musicVolume.val());
  },

  changeVoiceVolume() {
    this.model.set('voiceVolume', this.ui.$voiceVolume.val());
  },

  changeEffectsVolume() {
    this.model.set('effectsVolume', this.ui.$effectsVolume.val());
  },

  _updateLightingQualityUI() {
    const lightingQuality = this.model.get('lightingQuality');
    if (lightingQuality === CONFIG.LIGHTING_QUALITY_HIGH) {
      // high quality lighting
      this.ui.$buttonLightingQualityHigh.addClass('active');
      this.ui.$buttonLightingQualityMedium.removeClass('active');
      this.ui.$buttonLightingQualityLow.removeClass('active');
    } else if (lightingQuality === CONFIG.LIGHTING_QUALITY_MEDIUM) {
      // medium quality lighting
      this.ui.$buttonLightingQualityMedium.addClass('active');
      this.ui.$buttonLightingQualityLow.removeClass('active');
      this.ui.$buttonLightingQualityHigh.removeClass('active');
    } else {
      // low quality lighting
      this.ui.$buttonLightingQualityLow.addClass('active');
      this.ui.$buttonLightingQualityMedium.removeClass('active');
      this.ui.$buttonLightingQualityHigh.removeClass('active');
    }
  },

  _updateShadowQualityUI() {
    const shadowQuality = this.model.get('shadowQuality');
    if (shadowQuality === CONFIG.SHADOW_QUALITY_HIGH) {
      // high quality shadows
      this.ui.$buttonShadowQualityHigh.addClass('active');
      this.ui.$buttonShadowQualityLow.removeClass('active');
      this.ui.$buttonShadowQualityMedium.removeClass('active');
    } else if (shadowQuality === CONFIG.SHADOW_QUALITY_MEDIUM) {
      // medium quality shadows
      this.ui.$buttonShadowQualityMedium.addClass('active');
      this.ui.$buttonShadowQualityLow.removeClass('active');
      this.ui.$buttonShadowQualityHigh.removeClass('active');
    } else {
      // low quality shadows
      this.ui.$buttonShadowQualityLow.addClass('active');
      this.ui.$buttonShadowQualityMedium.removeClass('active');
      this.ui.$buttonShadowQualityHigh.removeClass('active');
    }
  },

  _updateBoardQualityUI() {
    const boardQuality = this.model.get('boardQuality');
    if (boardQuality === CONFIG.SHADOW_QUALITY_HIGH) {
      // high quality board
      this.ui.$buttonBoardQualityHigh.addClass('active');
      this.ui.$buttonBoardQualityLow.removeClass('active');
    } else {
      // low quality board
      this.ui.$buttonBoardQualityLow.addClass('active');
      this.ui.$buttonBoardQualityHigh.removeClass('active');
    }
  },

});

module.exports = SettingsMenuView;
