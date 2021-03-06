import React, { Component } from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import ReactPhoneInput from 'react-phone-input-2';

import closeOrDismissIcon from '../../res/images/fa-close-or-dismiss.svg';

import {
  onRequestShowDialPad
} from '../../reducers/acReducer';

import styles from './dialpad.css';

import sessionManager from './../../api/sessionManager';
import DialPad from './dialpad';
import lo from 'lodash';

class Body extends Component {
  constructor (props) {
    super(props);
    this.state = {
      phoneNumber: ''
    };
    this.handleInputChange = this.handleInputChange.bind(this);
    this.numPadHandler = this.numPadHandler.bind(this);
  }

  closeDialPad () {
    this.props.closeDialPad();
  }

  handleInputChange (value) {
    this.setState({
      phoneNumber: value
    });
  }

  numPadHandler (...argv) {
    const value = lo.first(argv, null);
    if (!value) {
      return;
    }
    const { phoneNumber } = this.state;
    this.setState({
      phoneNumber: `${phoneNumber}${value}`
    });
  }

  dialNumber () {
    const { phoneNumber } = this.state;
    sessionManager.dialNumber(phoneNumber).then(success => {
      this.closeDialPad();
    }, err => {
      console.error(err);
    });
  }

  render () {
    const dialableCountries = sessionManager.getDialableCountries();
    return (
      <div className="card-body" style={{ backgroundColor: '#ffffff' }}>
        <div className="row">
          <div className="col-md-10">
            <span className={styles.dialNumber}>Dial number</span>
          </div>
          <div className="col-md-2"
            onClick={() => this.closeDialPad()}>
            <img src={closeOrDismissIcon} className={styles.cursor}/>
          </div>
        </div>
        <div className="row mt-2">
          <div className="col-md-9">
            <ReactPhoneInput
              inputStyle={{ minWidth: '15.5em', maxWidth: '15.5em', boxShadow: 'none', borderRadius: '0' }}
              onlyCountries={dialableCountries}
              defaultCountry={'fi'}
              enableSearchField={true}
              value={this.state.phoneNumber}
              inputExtraProps={{
                name: 'phone',
                required: true,
                autoFocus: true
              }}
              onChange={this.handleInputChange}/>
          </div>
          <div className="col-md-3 p-0 m-0">
            <a className={`btn ${styles.dialButton}`}
              onClick={() => this.dialNumber()}>
                            Dial
            </a>
          </div>
        </div>
        <div className="row mt-4">
          <DialPad numPadHandler={this.numPadHandler}/>
        </div>
      </div>
    );
  }
}

Body.propTypes = {
  closeDialPad: PropTypes.func.isRequired
};
const mapStateToProps = state => ({});
const mapDispatchToProps = dispatch => ({
  closeDialPad: () => {
    dispatch(onRequestShowDialPad('close'));
  }
});

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(Body);
