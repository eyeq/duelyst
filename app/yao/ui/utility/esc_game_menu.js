const CONFIG = require('app/common/config');
const SDK = require('app/sdk');
const RSX = require('app/data/resources');
const audio_engine = require('app/audio/audio_engine');
const Scene = require('app/view/Scene');
const CompositeViewYao = require('app/yao/ui/common/composite_view_yao');

const EscGameMenuItemView = CompositeViewYao.extend({

  id: 'app-esc-game-menu',
  className: 'modal duelyst-modal',
  template: require('app/yao/ui/utility/templates/esc_game_menu.hbs'),

  ui: {
    $exit: '.btn-user-exit',
    $concede: '.concede',
  },

  events: {
    'click .settings': 'toggleSettingsMenu',

    'click .concede': 'onConcede',
  },

  onRender() {
    CompositeViewYao.prototype.onRender.apply(this, arguments);

    if (SDK.GameType.isLocalGameType(SDK.GameSession.getInstance().getGameType()) || SDK.GameSession.getInstance().getIsSpectateMode()) {
      this.ui.$concede.remove();
    } else {
      this.ui.$exit.remove();
    }
  },

  onShow() {
    CompositeViewYao.prototype.onShow.apply(this, arguments);

    audio_engine.current().play_effect_for_interaction(RSX.sfx_ui_tab_in.audio, CONFIG.SHOW_SFX_PRIORITY);
  },

  onConcede() {
    const gameSession = SDK.GameSession.getInstance();
    if (SDK.GameType.isNetworkGameType(gameSession.getGameType())) {
      if (gameSession.isOver()) {
        // allow loser to skip all remaining showing actions and go straight to game over screen
        const gameLayer = Scene.getInstance().getGameLayer();
        if (gameLayer != null && !gameLayer.getIsGameOver() && gameSession.getLoserId() === gameSession.getMyPlayerId()) {
          gameLayer.resetStepQueue();
          gameLayer.showGameOver();
        }
      } else {
        const concedeAction = gameSession.getMyPlayer().actionResign();
        gameSession.submitExplicitAction(concedeAction);
      }
    }
  },

});

module.exports = EscGameMenuItemView;
