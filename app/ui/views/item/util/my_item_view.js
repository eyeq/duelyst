const openUrl = require('app/common/openUrl');

const MyItemView = Backbone.Marionette.ItemView.extend({

  className: 'my-item-view',

  // #region Backbone

  onBeforeRender: function () {
    this.$el.find('[data-toggle=\'tooltip\']').tooltip('destroy');
  },

  onRender: function () {
    this.$el.find('[data-toggle=\'tooltip\']').tooltip();

    this.$el.on('click', 'a', function (e) {
      openUrl($(e.currentTarget).attr('href'));
      e.stopPropagation();
      e.preventDefault();
    });
  },

  // #endregion

  // #region

  showInvalidFormControl: function ($formControl, helpMessage) {
    let $formControl0;
    if (Array.isArray($formControl)) {
      $formControl0 = $formControl[0];

      for (const $elem of $formControl) {
        $elem.closest('.form-group').addClass('has-error');
        $elem.off('input');
        $elem.one('input', function () { this.hideInvalidFormControl($formControl); }.bind(this));
      }
    } else {
      $formControl0 = $formControl;

      $formControl.closest('.form-group').addClass('has-error');
      $formControl.off('input');
      $formControl.one('input', function () { this.hideInvalidFormControl($formControl); }.bind(this));
    }

    if (helpMessage) {
      const tooltipData = $formControl0.data('bs.tooltip');
      if (tooltipData == null || tooltipData.options.title !== helpMessage) {
        $formControl0.tooltip('destroy')
          .tooltip({ title: helpMessage, placement: 'left', trigger: 'manual' })
          .tooltip('show');
      }
    }
  },

  hideInvalidFormControl: function ($formControl) {
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

  // #endregion
});

module.exports = MyItemView;
