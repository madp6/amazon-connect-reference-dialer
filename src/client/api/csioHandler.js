'use strict';
import networkStrengthMonitor from './networkStrengthMonitor';
import audioFrequencyMonitor from './audioFrequencyMonitor';

import lo from 'lodash';
import databaseManager from './databaseManager';

const appId = APP_ID;
const appSecret = APP_SECRET;

class CSIOHandler {
  constructor () {
    this.callstats = undefined;
    this.dispatch = undefined;
    this.localUserId = undefined;
  }

  // eslint-disable-next-line handle-callback-err
  onCSIOInitialize (err, msg) {
    // console.warn('->', 'onCSIOInitialize', new Date(), err, msg);
  }

  onCSIOStats (stats) {
    // console.warn('->onCSIOStats', stats);
    if (stats && stats.fabricState === 'terminated') {
      return;
    }

    if (stats && stats.mediaStreamTracks) {
      let track1 = lo.first(stats.mediaStreamTracks);
      let track2 = lo.last(stats.mediaStreamTracks);

      // console.warn('~', stats);
      let audioIntputLevel = parseInt(track1.audioIntputLevel || track2.audioIntputLevel || 0);
      let audioOutputLevel = parseInt(track1.audioOutputLevel || track2.audioOutputLevel || 0);

      let track1Bitrate = track1.bitrate || 0;
      let track2Bitrate = track2.bitrate || 0;

      networkStrengthMonitor.addThroughput(track1Bitrate, track2Bitrate);
      audioFrequencyMonitor.addAudioLevel(audioIntputLevel, false);
      audioFrequencyMonitor.addAudioLevel(audioOutputLevel, true);
    }
  }

  doPrecallTest () {
    return new Promise((resolve) => {
      let cs = new callstats();
      cs.initialize(appId, appSecret, this.localUserId, {}, null, null);
      cs.on('preCallTestResults', (status, result) => {
        let testResult = databaseManager.savePrecalltestResult(result);

        let throughput = lo.get(result, 'throughput', 0);
        networkStrengthMonitor.addThroughput(throughput, throughput);
        resolve(testResult);
      });
    });
  }

  onCSIORecommendedConfigCallback (config) {
    // console.warn('->', 'onCSIORecommendedConfigCallback', new Date(), config);
  }

  onCSIOPrecalltestCallback (status, result) {
    // console.warn('->onCSIOPrecalltestCallback', status, result);
    databaseManager.savePrecalltestResult(result);
    let throughput = lo.get(result, 'throughput', 0);
    networkStrengthMonitor.addThroughput(throughput, throughput);
  }

  dispose () {
    this.dispatch = undefined;
  }

  register (dispatch = undefined, agent = undefined) {
    this.dispatch && this.dispose();
    this.dispatch = dispatch;

    if (!agent) {
      // console.error('agent object cannot be empty');
      return;
    }
    if (!CallstatsAmazonShim) {
      // console.error('CallstatsAmazonShim object cannot be empty');
      return;
    }
    const localUserId = agent.getName();
    this.localUserId = localUserId;
    const configParams = {};
    if (this.callstats) {
      this.callstats = undefined;
    }

    this.callstats = CallstatsAmazonShim.initialize(connect, appId, appSecret, localUserId, configParams, this.onCSIOInitialize, this.onCSIOStats);
    this.callstats.on('recommendedConfig', this.onCSIORecommendedConfigCallback.bind(this));
    this.callstats.on('preCallTestResults', this.onCSIOPrecalltestCallback.bind(this));
  }

  // Quick hack to send feedback in structural way before we have a API for that
  postProcessFeedback (feedbackJSON = {}) {
    let markedFeedback = [];
    for (let currentIssue of feedbackJSON.issueList || []) {
      for (let issue of currentIssue.items || []) {
        if (issue.marked === true) {
          markedFeedback.push(issue.text);
        }
      }
    }
    return markedFeedback;
  }

  sendFeedback (feedbackJSON = {}) {
    let markedFeedbackList = this.postProcessFeedback(feedbackJSON);
    let feedbackText = `${[feedbackJSON.feedbackText, ...markedFeedbackList].join(' ,')}`;
    const feedback = {
      userId: this.localUserId,
      overall: Math.max(feedbackJSON.feedbackRatings, 1),
      comment: feedbackText
    };
    CallstatsAmazonShim.sendUserFeedback(feedback, msg => {
      // console.warn('on submitted feedback ', msg);
    });
  }

  sendFeedbackRating (feedbackRating = 1) {
    const feedback = {
      userId: this.localUserId,
      overall: Math.max(feedbackRating, 1)
    };
    CallstatsAmazonShim.sendUserFeedback(feedback, msg => {
      console.warn('on submitted rating ', msg);
    });
  }
}

const csioHandler = new CSIOHandler();
export default csioHandler;
