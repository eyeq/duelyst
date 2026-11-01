const CompositeViewYao = require('app/yao/ui/common/composite_view_yao');

/**
 * Loading/login utility menu that gives ability to open main esc menu.
 */
const UtilityLoadingLoginMenuItemView = CompositeViewYao.extend({

  id: 'app-utility-desktop-menu',
  template: require('app/yao/ui/login/templates/utility_loading_login_menu.hbs'),

  events: {
    'click .menu': 'toggleEscMainMenu',
  },

});

module.exports = UtilityLoadingLoginMenuItemView;
