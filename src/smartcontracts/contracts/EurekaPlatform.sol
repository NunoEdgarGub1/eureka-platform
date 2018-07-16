pragma solidity ^0.4.24;

import "./SafeMath.sol";
import "./Utils.sol";
import "./Eureka.sol";


contract EurekaPlatform is ERC677Receiver {

    /*
    *   journal parameters
    */

    // amount of rewarded reviewers
    uint minAmountOfEditorApprovedReviewer = 2;
    uint maxAmountOfEditorApprovedReviewer = 3;

    uint minAmountOfCommunityReviewer = 0;
    uint maxAmountOfCommunityReviewer = 5;


    // rewards amount
    uint sciencemattersFoundation = 1252;               // rounded up that fee equals 5000
    uint editorReward = 500;
    uint linkedArticlesReward = 750;
    uint invalidationWorkReward = 1000;
    uint[] editorApprovedReviewerRewardPerReviewer;
    uint[] communityReviewerRewardPerReviewer;
    uint[] secondReviewerRewardPerReviewer;


    // resulting submission fee
    uint submissionFee;


    constructor() {

        editorApprovedReviewerRewardPerReviewer.push(150);
        editorApprovedReviewerRewardPerReviewer.push(75);
        editorApprovedReviewerRewardPerReviewer.push(25);
        editorApprovedReviewerRewardPerReviewer.push(25);

        communityReviewerRewardPerReviewer.push(60);
        communityReviewerRewardPerReviewer.push(30);
        communityReviewerRewardPerReviewer.push(10);
        communityReviewerRewardPerReviewer.push(10);

        secondReviewerRewardPerReviewer.push(19);
        secondReviewerRewardPerReviewer.push(9);
        secondReviewerRewardPerReviewer.push(3);
        secondReviewerRewardPerReviewer.push(3);

        submissionFee =
        sciencemattersFoundation
        + editorReward
        + linkedArticlesReward
        + invalidationWorkReward
        + maxAmountOfEditorApprovedReviewer * editorApprovedReviewerRewardPerReviewer[0]
        + maxAmountOfEditorApprovedReviewer * editorApprovedReviewerRewardPerReviewer[1]
        + maxAmountOfEditorApprovedReviewer * editorApprovedReviewerRewardPerReviewer[2]
        + maxAmountOfCommunityReviewer * communityReviewerRewardPerReviewer[0]
        + maxAmountOfCommunityReviewer * communityReviewerRewardPerReviewer[1]
        + maxAmountOfCommunityReviewer * communityReviewerRewardPerReviewer[2]
        + (maxAmountOfEditorApprovedReviewer + maxAmountOfCommunityReviewer) * secondReviewerRewardPerReviewer[0]
        + (maxAmountOfEditorApprovedReviewer + maxAmountOfCommunityReviewer) * secondReviewerRewardPerReviewer[1]
        + (maxAmountOfEditorApprovedReviewer + maxAmountOfCommunityReviewer) * secondReviewerRewardPerReviewer[2];

    }


    // primary key mappings
    mapping(uint256 => ArticleSubmission) articleSubmissions;
    mapping(bytes32 => ArticleVersion) articlesVersions;
    mapping(uint256 => Review) reviews;

    // other mappings
    mapping(address => ArticleVersion[]) articleVersionByAuthor;
    mapping(address => ArticleSubmission[]) articleSubmissionsByEditor;
    mapping(address => Review[]) reviewsByReviewer;


    using SafeMath for uint256;

    enum SubmissionState {
        NOT_EXISTING,
        OPEN,
        CLOSED
    }
    // different ArticleVersions from different review-rounds are saved in the same ArticleSubmission Object
    struct ArticleSubmission {
        uint256 submissionId;
        SubmissionState submissionState;
        address submissionOwner;
        ArticleVersion[] versions;
        address editor;
    }

    enum ArticleVersionState {
        NOT_EXISTING,
        SUBMITTED,
        EDITOR_CHECKED,
        NOT_ENOUGH_REVIEWERS,
        NOT_ACCEPTED,
        ACCEPTED
    }
    // an ArticleSubmission can have different versions
    struct ArticleVersion {
        uint256 submissionId;
        bytes32 articleHash;
        // the timestamp when the article was published
        uint256 publishedTimestamp;
        // the URL where the article is saved
        bytes32 articleUrl;
        ArticleVersionState versionState;

        address[] authors;
        // the submission owner can weight the contributions of the different authors [0;10000]
        //  ( e.g. 3 authors with 1/3 contribution each: {3334,3333,3333} )
        uint8[] authorContributionRatio;
        // the hashes of the linked articles
        bytes32[] linkedArticles;
        // the submission owner can weight the impact of the linked articles [0;10000]
        uint8[] linkedArticlesSplitRatio;

        // the reviewers which are allowed to review that article as an editor approved reviewer
        address[] allowedEditorApprovedReviewers;
        // the reviewers which are approved from the editor
        // TODO how to check if Reviewer already saved a review -> with array for loop (expensive) maybe save additional mapping
        //        mapping(address => Review) editorApprovedReviews;
        Review[] editorApprovedReviews;

        // every community reviewer can add a community review without being approved
        // TODO how to check if Reviewer already saved a review -> with array for loop (expensive) maybe save additional mapping
        //        mapping(address => Review) communityReviews;
        Review[] communityReviews;

        // either save aggregated scores in article version or loop in GET method over review array
        uint8 score1;
        uint8 score2;
    }

    enum ReviewState {
        NOT_EXISTING,
        HANDED_IN,
        DECLINED,
        ACCEPTED
    }
    struct Review {
        uint256 reviewId;
        bytes32 reviewHash;
        uint256 reviewedTimestamp;
        address reviewer;

        ReviewState reviewState;

        uint8 score1;
        uint8 score2;
    }

    function submitArticle(bytes32 articleHash, bytes32 articleURL, address[] authors, bytes32[] linkedArticles, address[] allowedEditorApprovedReviewers) public payable {

    }

    /**
     * @title Receiver interface for ERC677 transferAndCall
     * @dev See https://github.com/ethereum/EIPs/issues/677 for specification and
     *      discussion.
     */
    function tokenFallback(address _sender, uint256 _value, bytes _extraData) returns (bool) {
        require(msg.sender == Eureka);
        require(_value == submissionPrice);
        uint256 payloadSize;
        uint256 payload;
        assembly {
            payloadSize := mload(_extraData)
            payload := mload(add(_extraData, 0x20))
        }
        payload = payload >> 8 * (32 - payloadSize);
        info[sender] = payload;
        return true;
    }


}