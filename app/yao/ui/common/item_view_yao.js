const openUrl = require('app/common/openUrl');
const NavigationManager = require("app/ui/managers/navigation_manager");

const ItemViewYao = Backbone.Marionette.ItemView.extend({

  onBeforeRender() {
    this.$el.find('[data-toggle=\'tooltip\']').tooltip('destroy');
  },

  onRender() {
    this.$el.find('[data-toggle=\'tooltip\']').tooltip();

    this.$el.on('click', 'a', (e) => {
      openUrl($(e.currentTarget).attr('href'));
      e.stopPropagation();
      e.preventDefault();
    });
  },

  onDestroy() {
    this.unlockTriggeredNavigation();
  },

  showInvalidFormControl($formControl, helpMessage) {
    let $formControl0;
    if (Array.isArray($formControl)) {
      $formControl0 = $formControl[0];

      for (const $elem of $formControl) {
        $elem.closest('.form-group').addClass('has-error');
        $elem.off('input');
        $elem.one('input', () => {
          this.hideInvalidFormControl($elem);
        });
      }
    } else {
      $formControl0 = $formControl;

      $formControl.closest('.form-group').addClass('has-error');
      $formControl.off('input');
      $formControl.one('input', () => {
        this.hideInvalidFormControl($formControl);
      });
    }

    if (helpMessage) {
      $formControl0.tooltip('destroy');
      setTimeout(() => {
        $formControl0.tooltip({ title: helpMessage, placement: 'left', trigger: 'manual' }).tooltip('show');
      }, 200);
    }
  },

  hideInvalidFormControl($formControl) {
    if (Array.isArray($formControl)) {
      for (const $elem of $formControl) {
        $elem.closest('.form-group').removeClass('has-error');
        $elem.off('input');

        $elem.tooltip('destroy');
      }
    } else {
      $formControl.closest('.form-group').removeClass('has-error');
      $formControl.off('input');

      $formControl.tooltip('destroy');
    }
  },

  lockTriggeredNavigation() {
    this.$el.addClass('user-triggered-navigation-locked');
    NavigationManager.getInstance().requestUserTriggeredNavigationLocked(this.id);
  },

  unlockTriggeredNavigation() {
    this.$el.removeClass('user-triggered-navigation-locked');
    NavigationManager.getInstance().requestUserTriggeredNavigationUnlocked(this.id);
  },
});

module.exports = ItemViewYao;
