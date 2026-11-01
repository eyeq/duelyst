const Logger = require('app/common/logger');
const CONFIG = require('app/common/config');
const NavigationManager = require('app/ui/managers/navigation_manager');
const UtilsEngine = require('app/common/utils/utils_engine');
const UtilityMenuItemView = require('app/ui/views/item/utility_menu');
const GameMenuItemView = require('app/ui/views/item/esc_game_menu');

/**
 * In game utility menu that shows basic utilities plus buttons to exit/concede.
 */
const UtilityGameMenuItemView = UtilityMenuItemView.extend({

  id: 'app-utility-game-menu',
  template: require('app/yao/ui/game/templates/utility_game_menu.hbs'),

  events: {
    'click button.menu': 'toggleGameMenu',
  },

  /* region LAYOUT */

  onResize() {
    const endPosition = UtilsEngine.getCardsInHandEndPositionForCSS();
    this.$el.css(
      'transform',
      `translate(${(endPosition.x - 40.0) / 10.0}rem, ${(-endPosition.y + CONFIG.HAND_CARD_SIZE * 0.54) / 10.0}rem)`,
    );
  },

  /* endregion LAYOUT */

  toggleGameMenu() {
    NavigationManager.getInstance().toggleModalViewByClass(GameMenuItemView);
  },

});

// Expose the class either via CommonJS or the global object
module.exports = UtilityGameMenuItemView;
