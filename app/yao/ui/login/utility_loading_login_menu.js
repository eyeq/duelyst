const Logger = require('app/common/logger');
const CONFIG = require('app/common/config');
const NavigationManager = require('app/ui/managers/navigation_manager');
const UtilsEngine = require('app/common/utils/utils_engine');
const UtilityMenuItemView = require('app/ui/views/item/utility_menu');
const EscMainMenuItemView = require('app/ui/views/item/esc_main_menu');

/**
 * Loading/login utility menu that gives ability to open main esc menu.
 */
const UtilityLoadingLoginMenuItemView = UtilityMenuItemView.extend({

  id: 'app-utility-desktop-menu',
  template: require('app/yao/ui/login/templates/utility_loading_login_menu.hbs'),

  events: {
    'click button.menu': 'toggleEscMainMenu',
  },

  toggleEscMainMenu() {
    NavigationManager.getInstance().toggleModalViewByClass(EscMainMenuItemView);
  },

});

// Expose the class either via CommonJS or the global object
module.exports = UtilityLoadingLoginMenuItemView;
