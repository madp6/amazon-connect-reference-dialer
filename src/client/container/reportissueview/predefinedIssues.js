import React from 'react';
import PropTypes from 'prop-types';

import markFalseIcon from '../../res/images/fa-mark-false.svg';
import markTrueIcon from '../../res/images/fa-mark-true.svg';
import styles from './reportissue.css';

const PredefinedIssues = ({ onIssueListSelectionChange, issueList }) => (
  <div className="col-md-12" style={{}}>
    {
      issueList.map((issue, issueIndex) => (
        <div className={`row mt-${issue.name === '' ? 0 : 1}`} key={`issue-${issue.name}`}>
          <div className="col-md-12">
            <a className={styles.predefinedIssueName}> {issue.name} </a>
          </div>
          {
            issue.items.map((item, itemIndex) => (
              <div className="col-md-12" key={`issue-link-${item.text}`}>
                <a className={styles.predefinedIssueList}>
                  <img style={{ cursor: 'pointer' }}
										 onClick={() => onIssueListSelectionChange(issueIndex, itemIndex)}
										 src={item.marked ? markTrueIcon : markFalseIcon}/> {item.text} </a>
              </div>
            ))
          }
        </div>
      ))
    }
  </div>
);

PredefinedIssues.propTypes = {
  onIssueListSelectionChange: PropTypes.func.isRequired,
  issueList: PropTypes.array.isRequired
};

export default PredefinedIssues;
