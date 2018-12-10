import cron from 'cron';
import articleSubmissionService from '../db/article-submission-service.mjs';
import articleVersionService from '../db/article-version-service.mjs';
import reviewService from '../db/review-service.mjs';
import ArticleSubmissionState from '../schema/article-submission-state-enum.mjs';
import ArticleVersionState from '../schema/article-version-state-enum.mjs';
import ReviewState from '../schema/review-state-enum.mjs';
import {
  removeEditorFromSubmissionProcess,
  resignFromReviewing
} from '../../smartcontracts/methods/web3-platform-contract-methods.mjs';

const CronJob = cron.CronJob;
const SANITY_TIME_OUT_INTERVAL = 50; //timeout interval in seconds //TODO change to dropout time interval
const REVIEWER_TIME_OUT_INTERVAL = 20; //timeout interval in seconds //TODO change to dropout time interval
const CRONE_TIME_INTERVAL = '*/12 * * * * *'; // all 5 seconds // TODO change to real cronjob interval

let cronJob;
let platformContract;
let contractOwnerAddress;


export default {
  start: async (_platformContract, _contractOwnerAddress) => {
    platformContract = _platformContract;
    contractOwnerAddress = _contractOwnerAddress;


    cronJob = await new CronJob(CRONE_TIME_INTERVAL, async () => {
      console.log('NEW CRONJOB');
      // Remove editor which don't do sanity check
      const timedOutSubmissionIds = await getEditorTimeoutSubmissionIds();
      await removeEditorFromSubmissionbyScSubmissionId(timedOutSubmissionIds);
      // TODO inform editor by mail and in frontend

      // Resign reviewers which don't hand in a review to an articleVersion
      // TODO inform reviewers by mail and in frontend
      await removeTimedOutAssignedReviewers();
    }, null, true, 'Europe/Zurich');
  },

  stop: async () => {
    cronJob.stop();
  }
};

/**
 * First get all the submission ids from the article-version,
 * where the state is 'SUBMITTED' and the articleVersion State is 'EDITOR_ASSIGNED'.
 * Secondly, it checks if the time for the Editor to do the health-check is ran out.
 * If that is the case the submissionId of the corresponding Articlesubmission gets saved
 * and eventually returned with all other submissionIds.
 */
async function getEditorTimeoutSubmissionIds() {
  const submittedArticleVersions = await articleVersionService.getArticleVersionsByState(ArticleVersionState.SUBMITTED);
  let potentialTimedOutVersions = [];

  for(let submittedArticleVersion of submittedArticleVersions) {
    const correspondingArticleSubmission =
      await articleSubmissionService.getSubmissionById(submittedArticleVersion.articleSubmission);
    if(correspondingArticleSubmission.articleSubmissionState === ArticleSubmissionState.EDITOR_ASSIGNED) {
      potentialTimedOutVersions.push({articleVersion: submittedArticleVersion, submissionTimestamp: correspondingArticleSubmission.stateTimestamp, scSubmissionID: correspondingArticleSubmission.scSubmissionID});
    }
  }

  let timeoutSubmissionIds = [];

  let differences = [];
  let scIDs = [];

  for (let potentialTimedOutVersion of potentialTimedOutVersions) {
    const now = Math.round(new Date().getTime()/1000);
    const timestamp = potentialTimedOutVersion.submissionTimestamp;

    // only testing TODO remove
    scIDs.push(potentialTimedOutVersion.scSubmissionID);
    differences.push(now - timestamp);

    if((now - SANITY_TIME_OUT_INTERVAL - timestamp) > 0) {
      //sconsole.log(potentialTimedOutVersion);
      timeoutSubmissionIds.push(potentialTimedOutVersion.scSubmissionID);
    }
  }
  return timeoutSubmissionIds;
}

async function removeEditorFromSubmissionbyScSubmissionId(timedOutSubmissionIds) {
  if(timedOutSubmissionIds.length > 0) {

    for(let timedOutSubmissionId of timedOutSubmissionIds) {
      try{
        await removeEditorFromSubmissionProcess(
          platformContract,
          timedOutSubmissionId
        ).send({
          from: contractOwnerAddress
        });
      } catch (e) {
        console.warn('Removing of Editor is already done, ERROR-MESSAGE: ' + e);
      }
    }
  }
  return 'Remove Editors done';
}


async function removeTimedOutAssignedReviewers() {
  const signedUpReviews = await reviewService.getReviewsByState(ReviewState.SIGNED_UP_FOR_REVIEWING);
  console.log(signedUpReviews);
  const now = Math.round((new Date().getTime()/1000));

  for (let signedUpReview of signedUpReviews) {
    console.log('Difference: ' + (now - REVIEWER_TIME_OUT_INTERVAL - signedUpReview.stateTimestamp));
    if(now - REVIEWER_TIME_OUT_INTERVAL - signedUpReview.stateTimestamp > 0)  {
      const articleHash = (await articleVersionService.getArticleVersionById2(signedUpReview.articleVersion)).articleHash;

      try{
        await resignFromReviewing(
          platformContract,
          articleHash,
          signedUpReview.reviewerAddress
        ).send({
          from: contractOwnerAddress
        });
        console.log('Removing of Reviewer done');
      } catch (e) {
        console.warn('Removing of Reviewer is alread done, ERROR-MESSAGE: ' + e);
      }
    }
  }
  return 'Remove Reviewers done';
}