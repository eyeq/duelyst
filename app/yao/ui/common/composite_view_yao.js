const Logger = require('app/common/logger');
const CONFIG = require('app/common/config');
const EventBus = require('app/common/eventbus');
const EVENTS = require('app/common/event_types');
const NavigationManager = require('app/ui/managers/navigation_manager');
const Animations = require('app/ui/views/animations');
const ProfileManager = require('app/ui/managers/profile_manager');

/**
 * Basic utility menu that shows buttons for settings and buddies/chat.
 */
const CompositeViewYao = Backbone.Marionette.CompositeView.extend({

  events: {
    'click .shop': 'onClickShop',
    'click .booster-pack-collection': 'onClickBoosterPackCollection',
    'click .buddies': 'toggleBuddyList',
    'click .settings': 'toggleSettingsMenu',
    'click .profile': 'toggleProfile',
    'click .menu': 'toggleEscMainMenu',
  },

  animateIn: Animations.fadeIn,
  animateOut: Animations.fadeOut,

  onBeforeRender() {
    this.$el.find('[data-toggle=\'tooltip\']').tooltip('destroy');
    this.$el.find('[data-toggle=\'popover\']').popover('destroy');
  },

  onRender() {
    this.$el.find('[data-toggle=\'tooltip\']').tooltip({ container: CONFIG.OVERLAY_SELECTOR, trigger: 'hover' });
  },

  onShow() {
    this.animateReveal();
  },

  onDestroy() {
    this.$el.find('[data-toggle=\'tooltip\']').tooltip('destroy');
    this.$el.find('[data-toggle=\'popover\']').popover('destroy');
  },

  animateReveal() {
    const buttons = this.$el.find('.animate-reveal:visible');
    let delay = 400;
    for (let i = 0; i < buttons.length; i++) {
      $(buttons[i]).css('opacity', 0);
      buttons[i].animate([
        { opacity: 0.0, transform: 'translateY(10px)' },
        { opacity: 1.0, transform: 'translateY(0px)' },
      ], {
        duration: 200,
        delay,
        easing: 'cubic-bezier(0.39, 0.575, 0.565, 1)',
        fill: 'forwards',
      });
      delay += 100;
    }
  },

  onClickShop() {
    EventBus.getInstance().trigger(EVENTS.show_shop);
  },

  onClickBoosterPackCollection() {
    EventBus.getInstance().trigger(EVENTS.show_booster_pack_unlock);
  },

  toggleBuddyList() {
    // App.getIsLoggedIn()
    if (ProfileManager.getInstance().get('id')) {
      NavigationManager.getInstance().toggleModalViewByClass(require('app/ui/views/layouts/buddies'));
    }
  },

  toggleSettingsMenu() {
    NavigationManager.getInstance().toggleModalViewByClass(require('app/yao/ui/utility/settings_menu'), { model: ProfileManager.getInstance().profile });
  },

  toggleProfile() {
    NavigationManager.getInstance().toggleModalViewByClass(require('app/ui/views2/profile/profile_layout'), { model: ProfileManager.getInstance().profile });
  },

  toggleEscMainMenu() {
    NavigationManager.getInstance().toggleModalViewByClass(require('app/yao/ui/utility/esc_main_menu'));
  },

  showPopover($button, popoverData) {
    $button.popover('destroy');
    setTimeout(() => {
      $button.popover(popoverData);
      $button.popover('show');
    }, 200);
  },

  hidePopover($button) {
    $button.popover('destroy');
  },
});

module.exports = CompositeViewYao;
