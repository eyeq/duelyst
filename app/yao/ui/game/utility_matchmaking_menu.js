const Logger = require('app/common/logger');
const NavigationManager = require('app/ui/managers/navigation_manager');
const UtilityMenuItemView = require('app/ui/views/item/utility_menu');

/**
 * Matchmaking utility menu that shows basic utilities.
 */
const UtilityMatchmakingMenuItemView = UtilityMenuItemView.extend({

  id: 'app-utility-matchmaking-menu',
  template: require('app/yao/ui/game/templates/utility_matchmaking_menu.hbs'),
});

// Expose the class either via CommonJS or the global object
module.exports = UtilityMatchmakingMenuItemView;
