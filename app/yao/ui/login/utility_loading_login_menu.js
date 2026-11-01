'use strict';

var Logger = require('app/common/logger');
var CONFIG = require('app/common/config');
var UtilityLoadingLoginMenuTmpl = require('app/yao/ui/login/templates/utility_loading_login_menu.hbs');
var NavigationManager = require('app/ui/managers/navigation_manager');
var UtilsEngine = require('app/common/utils/utils_engine');
var UtilityMenuItemView = require('app/ui/views/item/utility_menu');
var EscMainMenuItemView = require('app/ui/views/item/esc_main_menu');

/**
 * Loading/login utility menu that gives ability to open main esc menu.
 */
var UtilityLoadingLoginMenuItemView = UtilityMenuItemView.extend({

  id: 'app-utility-desktop-menu',

  template: UtilityLoadingLoginMenuTmpl,

  events: {
    'click button.menu': 'toggleEscMainMenu',
  },

  toggleEscMainMenu: function () {
    NavigationManager.getInstance().toggleModalViewByClass(EscMainMenuItemView);
  },

});

// Expose the class either via CommonJS or the global object
module.exports = UtilityLoadingLoginMenuItemView;
