import React, { Component, Fragment } from 'react'
import TopNavigation from '../omg-page-layout/TopNavigation'
import styled from 'styled-components'
import { Button } from '../omg-uikit'
import ConfigurationsFetcher from '../omg-configuration/configurationFetcher'
import { withRouter } from 'react-router-dom'
import PropTypes from 'prop-types'
import ConfigRow from './ConfigRow'
import { compose } from 'recompose'
import { connect } from 'react-redux'
import {
  selectConfigurationsByKey,
  selectConfigurationLoadingStatus
} from '../omg-configuration/selector'
import { getConfiguration, updateConfiguration } from '../omg-configuration/action'
import CONSTANT from '../constants'
import { isEmail } from '../utils/validator'

const ConfigurationPageContainer = styled.div`
  position: relative;
  padding-bottom: 150px;
  h4 {
    margin-top: 50px;
  }
  button {
    padding-left: 25px;
    padding-right: 25px;
  }
`

const SubSettingContainer = styled.div`
  > div {
    margin-left: 25px;
    padding: 0 20px;
    background-color: ${props => props.theme.colors.S100};
    border-radius: 4px;
    border: 1px solid transparent;
    div:first-child {
      flex: 0 0 175px;
    }
  }
`

const enhance = compose(
  withRouter,
  connect(
    state => {
      return {
        configurations: selectConfigurationsByKey(state),
        configurationLoadingStatus: selectConfigurationLoadingStatus(state)
      }
    },
    { getConfiguration, updateConfiguration }
  )
)

class ConfigurationPage extends Component {
  static propTypes = {
    configurations: PropTypes.object,
    configurationLoadingStatus: PropTypes.string,
    updateConfiguration: PropTypes.func
  }

  static getDerivedStateFromProps (props, state) {
    if (!state.fetched && props.configurationLoadingStatus === CONSTANT.LOADING_STATUS.SUCCESS) {
      return {
        baseUrl: props.configurations.base_url.value,
        redirectUrlPrefixes: props.configurations.redirect_url_prefixes.value,
        enableStandalone: props.configurations.enable_standalone.value,
        maxPerPage: props.configurations.max_per_page.value,
        minPasswordLength: props.configurations.min_password_length.value,
        senderEmail: props.configurations.sender_email.value,
        emailAdapter: props.configurations.email_adapter.value,
        smtpHost: props.configurations.smtp_host.value,
        smtpPort: props.configurations.smtp_port.value,
        smtpUsername: props.configurations.smtp_username.value,
        smtpPassword: props.configurations.smtp_password.value,
        fileStorageAdapter: props.configurations.file_storage_adapter.value,
        gcsBucket: props.configurations.gcs_bucket.value,
        gcsCredentials: props.configurations.gcs_credentials.value,
        awsBucket: props.configurations.aws_bucket.value,
        awsRegion: props.configurations.aws_region.value,
        awsAccessKeyId: props.configurations.aws_access_key_id.value,
        awsSecretAccessKey: props.configurations.aws_secret_access_key.value,
        balanceCachingStrategy: props.configurations.balance_caching_strategy.value,
        fetched: true
      }
    } else {
      return null
    }
  }

  state = {
    submitStatus: CONSTANT.LOADING_STATUS.DEFAULT
  }
  resetGcsState () {
    this.setState({
      gcsBucket: this.props.configurations.gcs_bucket.value,
      gcsCredentials: this.props.configurations.gcs_credentials.value
    })
  }
  resetAwsState () {
    this.setState({
      awsBucket: this.props.configurations.aws_bucket.value,
      awsRegion: this.props.configurations.aws_region.value,
      awsAccessKeyId: this.props.configurations.aws_access_key_id.value,
      awsSecretAccessKey: this.props.configurations.aws_secret_access_key.value
    })
  }
  onSelectEmailAdapter = option => {
    this.setState({ emailAdapter: option.value })
  }

  onSelectBalanceCache = option => {
    this.setState({ balanceCachingStrategy: option.value })
  }

  onSelectFileStorageAdapter = option => {
    switch (option.value) {
      case 'aws':
        this.resetGcsState()
        break
      case 'gcs':
        this.resetAwsState()
        break
      default:
        this.resetAwsState()
        this.resetGcsState()
    }
    this.setState({ fileStorageAdapter: option.value })
  }
  onChangeInput = key => e => {
    this.setState({ [key]: e.target.value })
  }
  onChangeRadio = enable => e => {
    this.setState({ enableStandalone: enable })
  }

  onClickSaveConfiguration = async e => {
    try {
      this.setState({ submitStatus: CONSTANT.LOADING_STATUS.PENDING })
      const result = await this.props.updateConfiguration({
        ...this.state,
        gcsCredentials: JSON.parse(this.state.gcsCredentials)
      })
      if (result.data) {
        this.setState({ submitStatus: CONSTANT.LOADING_STATUS.SUCCESS })
      } else {
        this.setState({ submitStatus: CONSTANT.LOADING_STATUS.FAILED })
      }
    } catch (error) {
      this.setState({ submitStatus: CONSTANT.LOADING_STATUS.FAILED })
    }
  }
  renderSaveButton = () => {
    return (
      <Button
        size='small'
        onClick={this.onClickSaveConfiguration}
        key={'save'}
        loading={this.state.submitStatus === CONSTANT.LOADING_STATUS.PENDING}
      >
        <span>Save Configuration</span>
      </Button>
    )
  }

  renderFileStorageAdpter (configurations) {
    return (
      <Fragment>
        <h4>File Storage Adapter</h4>
        <ConfigRow
          name={'File Storage Adapter'}
          description={configurations.file_storage_adapter.description}
          value={this.state.fileStorageAdapter}
          onSelectItem={this.onSelectFileStorageAdapter}
          type='select'
          options={configurations.file_storage_adapter.options.map(option => ({
            key: option,
            value: option
          }))}
        />
        {this.state.fileStorageAdapter === 'gcs' && (
          <SubSettingContainer>
            <div>
              <ConfigRow
                name={'GCS Bucket Key'}
                description={configurations.gcs_bucket.description}
                value={this.state.gcsBucket}
                placeholder={'ie. google_cloud_1'}
                onChange={this.onChangeInput('gcsBucket')}
              />
              <ConfigRow
                name={'GCS Credential JSON'}
                description={configurations.gcs_credentials.description}
                value={this.state.gcsCredentials}
                placeholder={'ie. AIzaSyD0g8OombPqMBoIhit8ESNj0TueP_OVx2w'}
                border={this.state.emailAdapter !== 'gcs'}
                onChange={this.onChangeInput('gcsCredentials')}
              />
            </div>
          </SubSettingContainer>
        )}
        {this.state.fileStorageAdapter === 'aws' && (
          <SubSettingContainer>
            <div>
              <ConfigRow
                name={'AWS Bucket name'}
                description={configurations.aws_bucket.description}
                value={this.state.awsBucket}
                placeholder={'ie. aws_bucket_1'}
                onChange={this.onChangeInput('awsBucket')}
              />
              <ConfigRow
                name={'AWS Region'}
                description={configurations.aws_region.description}
                value={this.state.awsRegion}
                placeholder={'ie. us-east-1'}
                onChange={this.onChangeInput('awsRegion')}
              />
              <ConfigRow
                name={'AWS Access Key ID'}
                description={configurations.aws_access_key_id.description}
                value={this.state.awsAccessKeyId}
                placeholder={'ie. AKIAIOSFODNN7EXAMPLE'}
                onChange={this.onChangeInput('awsAccessKeyId')}
              />
              <ConfigRow
                name={'AWS Secret Key'}
                description={configurations.aws_secret_access_key.description}
                value={this.state.awsSecretAccessKey}
                border={this.state.emailAdapter !== 'aws'}
                placeholder={'ie. wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY'}
                onChange={this.onChangeInput('awsSecretAccessKey')}
              />
            </div>
          </SubSettingContainer>
        )}
      </Fragment>
    )
  }
  renderCacheSetting (configurations) {
    return (
      <Fragment>
        <h4>Cache Setting</h4>
        <ConfigRow
          name={'Balance Caching Strategy'}
          description={configurations.balance_caching_strategy.description}
          value={this.state.balanceCachingStrategy}
          onSelectItem={this.onSelectBalanceCache}
          type='select'
          options={configurations.balance_caching_strategy.options.map(option => ({
            key: option,
            value: option
          }))}
        />
      </Fragment>
    )
  }
  renderGlobalSetting (configurations) {
    return (
      <Fragment>
        <h4>Global Setting</h4>
        <ConfigRow
          name={'Base Url'}
          description={configurations.base_url.description}
          value={this.state.baseUrl}
          onChange={this.onChangeInput('baseUrl')}
        />
        <ConfigRow
          name={'Redirect Url Prefixes'}
          description={configurations.redirect_url_prefixes.description}
          value={this.state.redirectUrlPrefixes}
          onChange={this.onChangeInput('redirectUrlPrefixes')}
        />
        <ConfigRow
          name={'Enable Standalone'}
          description={configurations.enable_standalone.description}
          value={this.state.enableStandalone}
          onChange={this.onChangeRadio}
          type='boolean'
        />
        <ConfigRow
          name={'Maximum Record Per Page'}
          description={configurations.max_per_page.description}
          value={this.state.maxPerPage}
          inputType='number'
          onChange={this.onChangeInput('maxPerPage')}
          inputValidator={value => Number(value) < 0}
          inputErrorMessage='invalid number'
        />
        <ConfigRow
          name={'Minimum Password Length'}
          description={configurations.min_password_length.description}
          value={this.state.minPasswordLength}
          inputType='number'
          onChange={this.onChangeInput('minPasswordLength')}
          inputValidator={value => Number(value) < 1}
          inputErrorMessage='invalid number'
        />
      </Fragment>
    )
  }
  renderEmailSetting (configurations) {
    return (
      <Fragment>
        <h4>Email Setting</h4>
        <ConfigRow
          name={'Sender Email'}
          description={configurations.sender_email.description}
          value={this.state.senderEmail}
          onChange={this.onChangeInput('senderEmail')}
          inputValidator={value => isEmail(value)}
        />
        <ConfigRow
          name={'Email Adapter'}
          description={configurations.email_adapter.description}
          value={this.state.emailAdapter}
          onSelectItem={this.onSelectEmailAdapter}
          onChange={this.onChangeInput('emailAdapter')}
          type='select'
          options={configurations.email_adapter.options.map(option => ({
            key: option,
            value: option
          }))}
        />
        {this.state.emailAdapter === 'smtp' && (
          <SubSettingContainer>
            <div>
              <ConfigRow
                name={'SMTP Host'}
                description={configurations.smtp_host.description}
                value={this.state.smtpHost}
                placeholder={'ie. smtp.yourdomain.com'}
                onChange={this.onChangeInput('smtpHost')}
              />
              <ConfigRow
                name={'SMTP Port'}
                description={configurations.smtp_port.description}
                value={this.state.smtpPort}
                placeholder={'ie. 8830'}
                onChange={this.onChangeInput('smtpPort')}
              />
              <ConfigRow
                name={'SMTP Username'}
                description={configurations.smtp_username.description}
                value={this.state.smtpUsername}
                placeholder={'ie. usertest01'}
                onChange={this.onChangeInput('smtpUsername')}
              />
              <ConfigRow
                name={'SMTP Password'}
                description={configurations.smtp_password.description}
                value={this.state.smtpPassword}
                border={this.state.emailAdapter !== 'smtp'}
                placeholder={'ie. password'}
                onChange={this.onChangeInput('smtpPassword')}
              />
            </div>
          </SubSettingContainer>
        )}
      </Fragment>
    )
  }
  renderConfigurationPage = ({ data: configurations }) => {
    return (
      <ConfigurationPageContainer>
        <TopNavigation
          title={'Configuration'}
          buttons={[this.renderSaveButton()]}
          secondaryAction={false}
          types={false}
        />
        {!_.isEmpty(this.props.configurations) && (
          <form>
            {this.renderGlobalSetting(this.props.configurations)}
            {this.renderEmailSetting(this.props.configurations)}
            {this.renderFileStorageAdpter(this.props.configurations)}
            {this.renderCacheSetting(this.props.configurations)}
          </form>
        )}
      </ConfigurationPageContainer>
    )
  }

  render () {
    return <ConfigurationsFetcher render={this.renderConfigurationPage} {...this.state} />
  }
}

export default enhance(ConfigurationPage)
